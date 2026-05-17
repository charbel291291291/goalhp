import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { supabase } from '../../lib/supabase';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  whatsapp: string | null;
  instagram: string | null;
  location: string | null;
}

export default function SponsorsIndex() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('sponsors').select('*').eq('active', true).then(({ data }) => {
      if (data && data.length > 0) setSponsors(data as Sponsor[]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">{t('sponsor.title')}</h1>
        <p className="text-sm text-white/50">{lang === 'ar' ? 'شركاؤنا في كأس العالم 2026' : 'Our World Cup 2026 partners'}</p>
      </motion.div>

      {loading ? (
        <div className="text-white/40 text-center py-12">{t('common.loading')}</div>
      ) : sponsors.length === 0 ? (
        <div className="text-white/40 text-center py-12">
          <p className="text-4xl mb-3">🤝</p>
          <p className="text-sm">{lang === 'ar' ? 'لا يوجد رعاة بعد' : 'No sponsors yet'}</p>
        </div>
      ) : (
        sponsors.map((sponsor, i) => (
          <motion.div key={sponsor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <div className="flex items-start gap-4">
                {sponsor.logo_url ? (
                  <img src={sponsor.logo_url} alt={sponsor.name}
                    className="w-16 h-16 rounded-xl object-cover bg-white/10"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                  />
                ) : null}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-gold/20 to-electric/20 flex items-center justify-center text-2xl font-bold text-white ${sponsor.logo_url ? 'hidden' : ''}`}>
                  {sponsor.name[0]?.toUpperCase() || 'S'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{sponsor.name}</h3>
                  {sponsor.description && <p className="text-xs text-white/50">{sponsor.description}</p>}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {sponsor.whatsapp && (
                      <a href={`https://wa.me/${sponsor.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank"
                        className="text-xs text-green-400 hover:underline">WhatsApp</a>
                    )}
                    {sponsor.instagram && (
                      <a href={`https://instagram.com/${sponsor.instagram.replace('@', '')}`} target="_blank"
                        className="text-xs text-pink-400 hover:underline">{sponsor.instagram}</a>
                    )}
                    {sponsor.location && <span className="text-xs text-white/30">{sponsor.location}</span>}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))
      )}

      <Card glow="gold">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-2">{t('sponsor.sponsored')}</div>
        <div className="flex items-center gap-4">
          <div className="text-3xl">⚡</div>
          <div>
            <h3 className="font-bold">{lang === 'ar' ? 'تحدي الرعاة' : 'Sponsor Challenge'}</h3>
            <p className="text-xs text-white/50">{lang === 'ar' ? 'اربح نقاطاً وجوائز من رعاتنا' : 'Earn points and prizes from our sponsors'}</p>
          </div>
        </div>
        <Button variant="gold" size="sm" className="mt-3 w-full">
          {lang === 'ar' ? 'شارك الآن' : 'Join Challenge'}
        </Button>
      </Card>
    </div>
  );
}
