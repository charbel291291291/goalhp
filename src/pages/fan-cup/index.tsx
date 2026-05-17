import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { useLocalQuery } from '../../lib/useData';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

const arabCountries = ['Lebanon', 'Saudi Arabia', 'Egypt', 'Morocco', 'Algeria', 'Tunisia', 'Iraq', 'Jordan', 'Syria', 'Palestine', 'Qatar', 'UAE', 'Kuwait', 'Oman', 'Bahrain', 'Yemen', 'Libya', 'Sudan', 'Mauritania', 'Somalia'];

const countryFlags: Record<string, string> = {
  'Lebanon': '🇱🇧', 'Saudi Arabia': '🇸🇦', 'Egypt': '🇪🇬', 'Morocco': '🇲🇦',
  'Algeria': '🇩🇿', 'Tunisia': '🇹🇳', 'Iraq': '🇮🇶', 'Jordan': '🇯🇴',
  'Syria': '🇸🇾', 'Palestine': '🇵🇸', 'Qatar': '🇶🇦', 'UAE': '🇦🇪',
  'Kuwait': '🇰🇼', 'Oman': '🇴🇲', 'Bahrain': '🇧🇭', 'Yemen': '🇾🇪',
  'Libya': '🇱🇾', 'Sudan': '🇸🇩', 'Mauritania': '🇲🇷', 'Somalia': '🇸🇴'
};

export default function FanCupPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';

  const { data: countries, loading } = useLocalQuery<{ country: string; points: number; players: number }[]>(async () => {
    const { data } = await supabase.from('profiles').select('country, points').not('country', 'is', null);
    if (!data) return [];
    const grouped: Record<string, { country: string; points: number; players: number }> = {};
    for (const p of data as Pick<Profile, 'country' | 'points'>[]) {
      if (p.country && arabCountries.includes(p.country)) {
        if (!grouped[p.country]) grouped[p.country] = { country: p.country, points: 0, players: 0 };
        grouped[p.country].points += p.points;
        grouped[p.country].players++;
      }
    }
    return Object.values(grouped).sort((a, b) => b.points - a.points);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('fanCup.title')}</h1>
        <p className="text-sm text-white/50">{t('fanCup.subtitle')}</p>
      </div>

      {loading ? (
        <div className="text-center text-white/40 py-12">{t('common.loading')}</div>
      ) : (
        <Card>
          <div className="space-y-1">
            {(countries || []).map((c, i) => (
              <div key={c.country} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <span className={`w-8 text-center font-bold ${i < 3 ? 'text-gold' : 'text-white/30'}`}>#{i + 1}</span>
                  <span className="text-2xl">{countryFlags[c.country] || '🏳️'}</span>
                  <div>
                    <div className="text-sm font-medium">{lang === 'ar' ? '—' : c.country}</div>
                    <div className="text-[10px] text-white/40">{c.players} {lang === 'ar' ? 'لاعب' : 'players'}</div>
                  </div>
                </div>
                <div className="text-gold font-bold text-sm">{c.points.toLocaleString()} <span className="text-[10px] text-white/40">pts</span></div>
              </div>
            ))}
            {(!countries || countries.length === 0) && (
              <div className="text-center text-white/30 py-8 text-sm">{lang === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}</div>
            )}
          </div>
        </Card>
      )}

      <div className="glass px-4 py-3 rounded-xl">
        <p className="text-xs text-white/40 text-center">{lang === 'ar' ? 'يتم احتساب النقاط بناءً على نقاط جميع اللاعبين من كل بلد' : 'Points are calculated from all players in each country'}</p>
      </div>
    </div>
  );
}
