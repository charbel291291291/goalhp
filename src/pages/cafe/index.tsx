import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../store/useAuth';
import toast from 'react-hot-toast';

type CafeZone = {
  id: string;
  name_en: string;
  name_ar: string;
  location?: string | null;
  member_count: number;
  points: number;
  code: string;
};

type CafeMember = {
  cafe_id: string;
};

export default function CafePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const { profile } = useAuth();

  const [cafes, setCafes] = useState<CafeZone[]>([]);
  const [myCafes, setMyCafes] = useState<CafeZone[]>([]);
  const [code, setCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name_en: '', name_ar: '', location: '' });
  const [loading, setLoading] = useState(true);

  const loadCafes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('cafe_zones').select('*').eq('active', true).order('points', { ascending: false }).limit(20);
    if (data) setCafes(data as unknown as CafeZone[]);
    if (profile) {
      const { data: memberships } = await supabase.from('cafe_members').select('cafe_id').eq('user_id', profile.id);
      if (memberships && memberships.length > 0) {
        const ids = (memberships as unknown as CafeMember[]).map((m) => m.cafe_id);
        const { data: myData } = await supabase.from('cafe_zones').select('*').in('id', ids);
        if (myData) setMyCafes(myData as unknown as CafeZone[]);
      }
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await Promise.resolve();
      if (!cancelled) await loadCafes();
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [loadCafes]);

  const handleJoin = async () => {
    if (!code.trim()) return;
    const { error } = await supabase.rpc('join_cafe', { p_code: code.trim() });
    if (error) { toast.error(error.message); return; }
    toast.success(lang === 'ar' ? 'تم الانضمام!' : 'Joined!');
    setCode('');
    setShowJoin(false);
    loadCafes();
  };

  const handleCreate = async () => {
    if (!form.name_en || !form.name_ar) { toast.error('Name required'); return; }
    const genCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase.from('cafe_zones').insert({
      name_en: form.name_en, name_ar: form.name_ar, location: form.location,
      owner_id: profile?.id, code: genCode, city: profile?.region
    });
    if (error) { toast.error(error.message); return; }
    toast.success(lang === 'ar' ? `تم الإنشاء! الرمز: ${genCode}` : `Created! Code: ${genCode}`);
    setShowCreate(false);
    setForm({ name_en: '', name_ar: '', location: '' });
    loadCafes();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('cafe.title')}</h1>
          <p className="text-sm text-white/50">{t('cafe.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowJoin(true)}>{t('cafe.join')}</Button>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>{t('cafe.create')}</Button>
        </div>
      </div>

      {/* My Cafes */}
      {myCafes.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-white/50 uppercase mb-3">{lang === 'ar' ? 'مقاهيي' : 'My Cafés'}</h3>
          <div className="space-y-2">
            {myCafes.map(cafe => (
              <Card key={cafe.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{lang === 'ar' ? cafe.name_ar : cafe.name_en}</div>
                    <div className="text-xs text-white/40">{cafe.location} · {cafe.member_count} {t('cafe.members')}</div>
                    <div className="text-[10px] text-electric mt-1">#{cafe.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gold font-bold">{cafe.points.toLocaleString()} pts</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Cafés */}
      <div>
        <h3 className="text-sm font-bold text-white/50 uppercase mb-3">{lang === 'ar' ? 'جميع المقاهي' : 'All Cafés'}</h3>
        {loading ? (
          <div className="text-center text-white/40 py-8">{t('common.loading')}</div>
        ) : cafes.length === 0 ? (
          <div className="text-center text-white/30 py-8 text-sm">{lang === 'ar' ? 'لا توجد مقاهي بعد' : 'No cafés yet'}</div>
        ) : (
          <div className="space-y-2">
            {cafes.map((cafe, i) => (
              <motion.div key={cafe.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-electric/20 flex items-center justify-center text-lg">☕</div>
                      <div>
                        <div className="font-bold">{lang === 'ar' ? cafe.name_ar : cafe.name_en}</div>
                        <div className="text-xs text-white/40">{cafe.location || lang === 'ar' ? 'غير محدد' : 'No location'} · {cafe.member_count} {t('cafe.members')}</div>
                      </div>
                    </div>
                    <div className="text-gold font-bold">{cafe.points.toLocaleString()} pts</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Join Modal */}
      {showJoin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowJoin(false)}>
          <div className="bg-navy-light border border-white/10 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">{t('cafe.join')}</h3>
            <p className="text-sm text-white/50 mb-4">{t('cafe.enterCode')}</p>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={8}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-center text-lg font-bold tracking-[0.3em]"
              placeholder="ABCDEF" />
            <div className="flex gap-2 mt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setShowJoin(false)}>{t('common.cancel')}</Button>
              <Button variant="primary" className="flex-1" onClick={handleJoin} disabled={code.length < 4}>{t('cafe.join')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-navy-light border border-white/10 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">{t('cafe.create')}</h3>
            <div className="space-y-3">
              <input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm" placeholder={lang === 'ar' ? 'اسم المقهى (إنجليزي)' : 'Café Name (English)'} />
              <input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm" placeholder={lang === 'ar' ? 'اسم المقهى (عربي)' : 'Café Name (Arabic)'} />
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm" placeholder={t('cafe.location')} />
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
              <Button variant="primary" className="flex-1" onClick={handleCreate} disabled={!form.name_en || !form.name_ar}>{t('common.save')}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="glass px-4 py-3 rounded-xl">
        <p className="text-xs text-white/40 text-center">{lang === 'ar' ? 'أنشئ مقهى افتراضي وتنافس مع المقاهي الأخرى!' : 'Create a virtual café and compete with other cafés!'}</p>
      </div>
    </div>
  );
}
