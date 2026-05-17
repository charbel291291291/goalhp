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

export default function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic'>('password');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'password') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/home');
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin + '/home' },
        });
        if (error) throw error;
        toast.success('Magic link sent! Check your email.');
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const lang = i18n.language as 'en' | 'ar';

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
          <h2 className="text-xl font-bold mb-6">{t('auth.login')}</h2>

          <form onSubmit={handleLogin} className="space-y-4">
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
            {mode === 'password' && (
              <div>
                <input
                  type="password"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-electric transition-colors"
                />
              </div>
            )}
            <Button variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? '...' : mode === 'password' ? t('auth.login') : t('auth.magicLink')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
              className="text-xs text-white/40 hover:text-electric transition-colors"
            >
              {mode === 'password' ? lang === 'ar' ? 'استخدم الرابط السحري' : 'Use Magic Link Instead' : lang === 'ar' ? 'استخدم كلمة المرور' : 'Use Password Instead'}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-white/40">
            {lang === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
            <button onClick={() => navigate('/signup')} className="text-electric hover:underline">
              {t('auth.signup')}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
