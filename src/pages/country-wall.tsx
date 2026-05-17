import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useArenaPosts, createArenaPost } from '../lib/useArena';
import toast from 'react-hot-toast';

const COUNTRIES = [
  { code: 'LB', name_en: 'Lebanon', name_ar: 'لبنان', flag: '🇱🇧' },
  { code: 'SY', name_en: 'Syria', name_ar: 'سوريا', flag: '🇸🇾' },
  { code: 'EG', name_en: 'Egypt', name_ar: 'مصر', flag: '🇪🇬' },
  { code: 'IQ', name_en: 'Iraq', name_ar: 'العراق', flag: '🇮🇶' },
  { code: 'JO', name_en: 'Jordan', name_ar: 'الأردن', flag: '🇯🇴' },
  { code: 'SA', name_en: 'Saudi Arabia', name_ar: 'السعودية', flag: '🇸🇦' },
  { code: 'MA', name_en: 'Morocco', name_ar: 'المغرب', flag: '🇲🇦' },
  { code: 'DZ', name_en: 'Algeria', name_ar: 'الجزائر', flag: '🇩🇿' },
  { code: 'TN', name_en: 'Tunisia', name_ar: 'تونس', flag: '🇹🇳' },
  { code: 'QA', name_en: 'Qatar', name_ar: 'قطر', flag: '🇶🇦' },
  { code: 'AE', name_en: 'UAE', name_ar: 'الإمارات', flag: '🇦🇪' },
  { code: 'KW', name_en: 'Kuwait', name_ar: 'الكويت', flag: '🇰🇼' },
  { code: 'PS', name_en: 'Palestine', name_ar: 'فلسطين', flag: '🇵🇸' },
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatTime(ts: string, nowTs: number): string {
  const diff = nowTs - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function CountryWall() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const { data: posts, loading, refetch } = useArenaPosts(undefined, undefined, selectedCountry || undefined);
  const [postText, setPostText] = useState('');
  const [nowTs, setNowTs] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;

    async function run() {
      await Promise.resolve();
      if (cancelled) return;
      setNowTs(new Date().getTime());
      intervalId = window.setInterval(() => {
        setNowTs(new Date().getTime());
      }, 60000);
    }

    void run();
    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  const handlePost = async () => {
    if (!postText.trim() || !selectedCountry) return;
    try {
      const result = await createArenaPost('text', postText.trim(), undefined, undefined, undefined, selectedCountry);
      if (result?.success) { setPostText(''); refetch(); toast.success(lang === 'ar' ? 'تم النشر!' : 'Posted!'); }
    } catch (e: unknown) { toast.error(getErrorMessage(e)); }
  };

  if (!selectedCountry) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t('arena.countryWall')}</h1>
        <p className="text-xs text-white/50">{lang === 'ar' ? 'اختر بلداً' : 'Select a country'}</p>
        <div className="grid grid-cols-2 gap-2">
          {COUNTRIES.map(c => (
            <button key={c.code} onClick={() => setSelectedCountry(c.name_en)}
              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-center transition-all">
              <div className="text-3xl mb-1">{c.flag}</div>
              <div className="text-sm font-bold">{lang === 'ar' ? c.name_ar : c.name_en}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const country = COUNTRIES.find(c => c.name_en === selectedCountry);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelectedCountry(null)} className="text-white/60 hover:text-white">←</button>
        <span className="text-3xl">{country?.flag}</span>
        <div>
          <h1 className="text-xl font-bold">{country ? (lang === 'ar' ? country.name_ar : country.name_en) : selectedCountry}</h1>
          <p className="text-xs text-white/50">{t('arena.countryWall')}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input value={postText} onChange={e => setPostText(e.target.value)} maxLength={300}
          placeholder={t('arena.createPost')}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none" />
        <Button variant="primary" size="sm" onClick={handlePost} disabled={!postText.trim()}>{t('arena.post')}</Button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="text-3xl animate-football-spin mx-auto">⚽</div></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-white/40 text-sm">{t('arena.noPosts')}</div>
      ) : (
        <div className="space-y-2">
          {posts.map(p => (
            <Card key={p.id} className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold">{p.user?.username || 'Anonymous'}</span>
                <span className="text-[9px] text-white/30">{formatTime(p.created_at, nowTs)}</span>
              </div>
              <p className="text-sm">{p.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
