import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { useLocalQuery } from '../../lib/useData';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

const lebanonCities = ['Beirut', 'Tripoli', 'Saida', 'Tyre', 'Zahle', 'Nabatieh', 'Jounieh', 'Byblos', 'Baalbek', 'Akkar', 'Chouf', 'Aley', 'Metn', 'Keserwan', 'Zgharta', 'Batroun'];
const syriaCities = ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Deir ez-Zor', 'Raqqa', 'Idlib', 'Daraa', 'Tartus', 'Al-Hasakah', 'Qamishli'];

export default function CityLeaguePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const [country, setCountry] = useState<'lebanon' | 'syria'>('lebanon');

  const cityList = country === 'lebanon' ? lebanonCities : syriaCities;

  const { data: cities, loading } = useLocalQuery<{ city: string; points: number; players: number }[]>(async () => {
    const { data } = await supabase.from('profiles').select('region, points').not('region', 'is', null);
    if (!data) return [];
    const grouped: Record<string, { city: string; points: number; players: number }> = {};
    for (const p of data as Pick<Profile, 'region' | 'points'>[]) {
      if (p.region && cityList.includes(p.region)) {
        if (!grouped[p.region]) grouped[p.region] = { city: p.region, points: 0, players: 0 };
        grouped[p.region].points += p.points;
        grouped[p.region].players++;
      }
    }
    return Object.values(grouped).sort((a, b) => b.points - a.points);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('city.title')}</h1>
        <p className="text-sm text-white/50">{t('city.subtitle')}</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setCountry('lebanon')}
          className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${country === 'lebanon' ? 'bg-electric text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
          🇱🇧 {t('city.lebanon')}
        </button>
        <button onClick={() => setCountry('syria')}
          className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${country === 'syria' ? 'bg-electric text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
          🇸🇾 {t('city.syria')}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-white/40 py-12">{t('common.loading')}</div>
      ) : (
        <Card>
          <div className="space-y-1">
            {(cities || []).map((c, i) => (
              <div key={c.city} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <span className={`w-8 text-center font-bold ${i < 3 ? 'text-gold' : 'text-white/30'}`}>#{i + 1}</span>
                  <div>
                    <div className="text-sm font-medium">{c.city}</div>
                    <div className="text-[10px] text-white/40">{c.players} {lang === 'ar' ? 'لاعب' : 'players'}</div>
                  </div>
                </div>
                <div className="text-gold font-bold text-sm">{c.points.toLocaleString()} <span className="text-[10px] text-white/40">pts</span></div>
              </div>
            ))}
            {(!cities || cities.length === 0) && (
              <div className="text-center text-white/30 py-8 text-sm">{lang === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
