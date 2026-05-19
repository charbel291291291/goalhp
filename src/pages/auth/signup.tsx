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

const USERNAME_RE = /^[a-zA-Z0-9_]{2,30}$/;

function validateUsername(value: string): string | null {
  if (!value) return 'Username is required';
  if (value.length < 2) return 'Username must be at least 2 characters';
  if (value.length > 30) return 'Username must be 30 characters or fewer';
  if (!USERNAME_RE.test(value)) return 'Username may only contain letters, numbers and underscores';
  return null;
}

export default function Signup() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameError(validateUsername(value));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateUsername(username);
    if (err) {
      setUsernameError(err);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) throw error;
      if (data.user) {
        // Use upsert (not insert) to handle the race where onAuthStateChange
        // may have already created the profile row with id-only. ignoreDuplicates:false
        // ensures we always write the username even if the row pre-exists.
        await supabase.from('profiles').upsert(
          { id: data.user.id, username, language: i18n.language },
          { onConflict: 'id' }
        );
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
                onChange={(e) => handleUsernameChange(e.target.value)}
                required
                minLength={2}
                maxLength={30}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none transition-colors ${
                  usernameError ? 'border-red-500 focus:border-red-400' : 'border-white/10 focus:border-electric'
                }`}
              />
              {usernameError && (
                <p className="text-xs text-red-400 mt-1 px-1">{usernameError}</p>
              )}
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
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading || !!usernameError}
            >
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
