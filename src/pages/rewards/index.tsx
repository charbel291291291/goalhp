import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../store/useAuth';
import { supabase } from '../../lib/supabase';
import { formatPoints, generateCode } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Reward {
  id: string;
  sponsor_id: string;
  title_en: string;
  title_ar: string;
  description_en: string | null;
  description_ar: string | null;
  image_url: string | null;
  points_required: number;
  quantity: number;
  active: boolean;
  sponsors?: { name: string };
}

const BG_COLORS = [
  'from-amber-900/30 to-amber-700/10',
  'from-red-900/30 to-red-700/10',
  'from-purple-900/30 to-purple-700/10',
  'from-cyan-900/30 to-cyan-700/10',
  'from-yellow-900/30 to-yellow-700/10',
  'from-green-900/30 to-green-700/10',
];

export default function RewardsIndex() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const { profile } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [redemption, setRedemption] = useState<{ code: string; title: string } | null>(null);

  useEffect(() => {
    supabase.from('rewards').select('*, sponsors(name)').eq('active', true).then(({ data }) => {
      if (data && data.length > 0) setRewards(data as unknown as Reward[]);
      setLoading(false);
    });
  }, []);

  const handleRedeem = (reward: Reward) => {
    const userPoints = profile?.points || 0;
    if (userPoints < reward.points_required) {
      toast.error(lang === 'ar' ? 'نقاط غير كافية' : 'Not enough points');
      return;
    }
    const code = generateCode();
    setRedemption({ code, title: lang === 'ar' ? reward.title_ar : reward.title_en });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">{t('rewards.title')}</h1>
        <p className="text-sm text-white/50">{lang === 'ar' ? 'استبدل نقاطك بجوائز وخصومات' : 'Redeem your points for rewards and discounts'}</p>
      </motion.div>

      <Card className="text-center p-4">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">{lang === 'ar' ? 'نقاطي' : 'My Points'}</div>
        <div className="text-4xl font-black text-gold">{formatPoints(profile?.points || 0)}</div>
      </Card>

      {loading ? (
        <div className="text-white/40 text-center py-12">{t('common.loading')}</div>
      ) : rewards.length === 0 ? (
        <div className="text-white/40 text-center py-12">
          <p className="text-4xl mb-3">🎁</p>
          <p className="text-sm">{lang === 'ar' ? 'لا توجد مكافآت حالياً' : 'No rewards available yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {rewards.map((reward, i) => {
            const colorIndex = parseInt(reward.id.replace(/-/g, '').slice(0, 8), 16) % BG_COLORS.length;
            return (
              <motion.div key={reward.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`bg-gradient-to-br ${BG_COLORS[colorIndex]} border-0 p-0 overflow-hidden`}>
                  <div className="p-3">
                    {reward.image_url ? (
                      <div className="w-full h-24 rounded-lg overflow-hidden mb-2 bg-white/5">
                        <img src={reward.image_url} alt={reward.title_en}
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-24 rounded-lg mb-2 bg-white/5 flex items-center justify-center text-3xl">
                        🎁
                      </div>
                    )}
                    {reward.sponsors?.name && (
                      <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{reward.sponsors.name}</div>
                    )}
                    <h3 className="text-sm font-bold leading-tight">{lang === 'ar' ? reward.title_ar : reward.title_en}</h3>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{lang === 'ar' ? reward.description_ar : reward.description_en}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-gold">{formatPoints(reward.points_required)} pts</span>
                      <span className="text-[10px] text-white/30">{reward.quantity > 0 ? `${reward.quantity} left` : 'unlimited'}</span>
                    </div>
                    <Button variant="primary" size="sm" className="w-full mt-2 text-xs"
                      onClick={() => handleRedeem(reward)}>
                      {t('rewards.redeem')}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={lang === 'ar' ? 'تم الاستبدال!' : 'Redeemed!'}>
        {redemption && (
          <div className="text-center">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-lg font-bold mb-1">{redemption.title}</p>
            <p className="text-xs text-white/50 mb-4">{t('rewards.terms')}</p>
            <div className="bg-white/10 rounded-2xl p-6 mb-4 border-2 border-dashed border-gold/50">
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('rewards.code')}</div>
              <div className="text-3xl font-black tracking-[0.25em] text-gold">{redemption.code}</div>
            </div>
            <p className="text-xs text-white/40">{t('rewards.scanned')}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
