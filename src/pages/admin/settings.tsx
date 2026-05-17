import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export default function AdminSettings() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">⚙️ {t('admin.settings')}</h1>

      <Card>
        <h3 className="font-bold mb-4">{lang === 'ar' ? 'إعدادات التطبيق' : 'App Settings'}</h3>
        <div className="space-y-4">
          {[
            { label: lang === 'ar' ? 'اسم التطبيق' : 'App Name', value: 'QuizGoal 2026' },
            { label: lang === 'ar' ? 'النسخة' : 'Version', value: '1.0.0' },
            { label: lang === 'ar' ? 'التوقعات مفعلة' : 'Predictions Enabled', value: 'true' },
            { label: lang === 'ar' ? 'حرب المنتخبات مفعلة' : 'Team War Enabled', value: 'true' },
            { label: lang === 'ar' ? 'دوري شوارع لبنان' : 'Street League Lebanon', value: 'true' },
          ].map((setting, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-sm text-white/70">{setting.label}</span>
              <span className="text-sm text-white/40">{setting.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold mb-4">{lang === 'ar' ? 'إجراءات' : 'Actions'}</h3>
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            🗑️ {lang === 'ar' ? 'مسح ذاكرة التخزين المؤقت' : 'Clear Cache'}
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            📊 {lang === 'ar' ? 'تصدير البيانات' : 'Export Data'}
          </Button>
          <Button variant="ghost" className="w-full justify-start text-red-400">
            🛑 {lang === 'ar' ? 'إيقاف التطبيق' : 'Disable App'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
