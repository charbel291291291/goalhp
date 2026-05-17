import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import toast from 'react-hot-toast';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function Signup() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });
      if (error) throw error;
      if (data.user) {
        // Create profile
        await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          language: i18n.language,
        });
        navigate('/onboarding');
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-gradient">QuizGoal</div>
          <div className="text-white/40 text-sm mt-1">2026</div>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">{t('auth.signup')}</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder={t('auth.username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-electric transition-colors"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-electric transition-colors"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-electric transition-colors"
              />
            </div>
            <Button variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? '...' : t('auth.signup')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-white/40">
            {i18n.language === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
            <button onClick={() => navigate('/login')} className="text-electric hover:underline">
              {t('auth.login')}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
