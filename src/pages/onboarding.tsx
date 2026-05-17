import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/useAuth';
import { useUI } from '../store/useUI';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { allTeams, regions } from '../lib/teams';
import toast from 'react-hot-toast';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const { profile, refreshProfile } = useAuth();
  const { language, setLanguage } = useUI();
  const [step, setStep] = useState(1);
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [country, setCountry] = useState('Lebanon');
  const [region, setRegion] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const lang = i18n.language as 'en' | 'ar';

  const handleSave = async () => {
    if (!accepted || saving) return;

    localStorage.setItem('quizgoal_onboarding_complete', 'true');
    localStorage.setItem('quizgoal_favorite_team', favoriteTeam);
    localStorage.setItem('quizgoal_country', country);
    localStorage.setItem('quizgoal_region', country === 'Lebanon' ? region : '');
    localStorage.setItem('quizgoal_language', language);

    if (!profile) {
      toast.success('Setup completed');
      navigate('/home');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          favorite_team_id: favoriteTeam,
          country,
          region: country === 'Lebanon' ? region : null,
          language,
        } as any)
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Setup completed');
      navigate('/home');
    } catch (err: any) {
      toast.error(err?.message || 'Could not save onboarding');
      navigate('/home');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-gradient">QuizGoal</div>
          <div className="text-white/40 text-sm">2026</div>
        </div>

        <div className="glass p-6 rounded-2xl">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-xl font-bold mb-2">{t('onboarding.pickTeam')}</h2>
              <p className="text-white/50 text-sm mb-6">{lang === 'ar' ? 'اختر منتخبك المفضل من 48 منتخباً' : 'Choose from 48 World Cup teams'}</p>
              <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto mb-6">
                {allTeams.map((team) => (
                  <button
                    key={team.fifa_code}
                    onClick={() => setFavoriteTeam(team.fifa_code)}
                    className={`p-2 rounded-xl text-center transition-all ${
                      favoriteTeam === team.fifa_code
                        ? 'bg-electric text-white scale-105'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    <div className="text-2xl mb-1">{team.flag_emoji}</div>
                    <div className="text-[10px] leading-tight">{lang === 'ar' ? team.name_ar : team.name_en}</div>
                  </button>
                ))}
              </div>
              <Button variant="primary" className="w-full" disabled={!favoriteTeam} onClick={() => setStep(2)}>
                {t('common.next')}
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-xl font-bold mb-2">{t('onboarding.pickCountry')}</h2>
              <p className="text-white/50 text-sm mb-6">{lang === 'ar' ? 'اختر بلدك' : 'Select your country'}</p>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-6 focus:outline-none focus:border-electric"
              >
                <option value="Lebanon">Lebanon 🇱🇧</option>
                <option value="Other">Other</option>
              </select>

              {country === 'Lebanon' && (
                <>
                  <h2 className="text-xl font-bold mb-2">{t('onboarding.pickRegion')}</h2>
                  <p className="text-white/50 text-sm mb-6">{lang === 'ar' ? 'اختر منطقتك في لبنان' : 'Select your region in Lebanon'}</p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto mb-6">
                    {regions.map((r) => (
                      <button
                        key={r.name_en}
                        onClick={() => setRegion(r.name_en)}
                        className={`p-2 rounded-xl text-center text-sm transition-all ${
                          region === r.name_en
                            ? 'bg-electric text-white'
                            : 'bg-white/5 hover:bg-white/10 text-white/70'
                        }`}
                      >
                        {lang === 'ar' ? r.name_ar : r.name_en}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <Button variant="primary" className="w-full" disabled={country === 'Lebanon' && !region} onClick={() => setStep(3)}>
                {t('common.next')}
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-xl font-bold mb-2">{t('onboarding.pickLanguage')}</h2>
              <p className="text-white/50 text-sm mb-6">{lang === 'ar' ? 'اختر لغتك المفضلة' : 'Choose your preferred language'}</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setLanguage('en')}
                  className={`p-6 rounded-xl text-center transition-all ${
                    language === 'en' ? 'bg-electric text-white scale-105' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-2">🇬🇧</div>
                  <div className="font-semibold">English</div>
                </button>
                <button
                  onClick={() => setLanguage('ar')}
                  className={`p-6 rounded-xl text-center transition-all ${
                    language === 'ar' ? 'bg-electric text-white scale-105' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-2">🇱🇧</div>
                  <div className="font-semibold font-arabic">العربية</div>
                </button>
              </div>

              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 accent-electric"
                />
                <span className="text-sm text-white/60">{t('onboarding.acceptRules')}</span>
              </label>

              <Button variant="neon" className="w-full" disabled={!accepted || saving} onClick={handleSave}>
                {saving ? '...' : t('onboarding.start')}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

