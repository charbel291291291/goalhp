import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function PosterIndex() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">{t('poster.title')}</h1>
        <p className="text-sm text-white/50">{lang === 'ar' ? 'اصنع بوستر تشجيعي لمنتخبك' : 'Create a fan poster for your team'}</p>
      </motion.div>

      <Card glow="blue" className="text-center p-8">
        <div className="text-6xl mb-4">🎨</div>
        <h2 className="text-xl font-bold mb-2">{lang === 'ar' ? 'بوستر تشجيع' : 'Fan Poster'}</h2>
        <p className="text-sm text-white/50 mb-6">
          {lang === 'ar' ? 'اصنع بوستراً فريداً لمنتخبك المفضل في كأس العالم 2026' : 'Create a unique poster for your favorite World Cup 2026 team'}
        </p>
        <Button variant="primary" size="lg" onClick={() => navigate('/poster/generator')}>
          {t('poster.generate')}
        </Button>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">{lang === 'ar' ? 'المعرض' : 'Gallery'}</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/poster/gallery')}>
            {lang === 'ar' ? 'عرض الكل' : 'View All'}
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-gradient-to-br from-electric/10 to-neon/10 flex items-center justify-center text-white/20 text-sm">
              🖼️
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/poster/generator')} className="card-premium text-center p-4">
          <div className="text-3xl mb-2">🖼️</div>
          <div className="text-xs text-white/70">{lang === 'ar' ? '9 أنماط' : '9 Styles'}</div>
        </button>
        <button onClick={() => navigate('/poster/gallery')} className="card-premium text-center p-4">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-xs text-white/70">{lang === 'ar' ? 'صوّت على البوسترات' : 'Vote on Posters'}</div>
        </button>
      </div>
    </div>
  );
}
