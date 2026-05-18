import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { supabase } from '../../lib/supabase';
import { useLocalQuery } from '../../lib/useData';
import toast from 'react-hot-toast';
import type { AppSettings } from '../../types';

export default function AdminSettings() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const { data: settings, loading, refetch } = useLocalQuery<AppSettings[]>(async () => {
    const { data, error } = await supabase.from('app_settings').select('*').order('key');
    if (error) throw error;
    return (data ?? []) as AppSettings[];
  }, []);

  const handleSave = async (key: string) => {
    if (!(key in edits)) return;
    setSaving(key);
    let parsed: unknown;
    try {
      parsed = JSON.parse(edits[key]);
    } catch {
      parsed = edits[key];
    }
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value: parsed, updated_at: new Date().toISOString() });
    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success(`${key} saved`);
      setEdits((prev) => { const next = { ...prev }; delete next[key]; return next; });
      refetch();
    }
    setSaving(null);
  };

  const displayValue = (v: unknown): string => {
    if (typeof v === 'object') return JSON.stringify(v, null, 2);
    return String(v ?? '');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">⚙️ {t('admin.settings')}</h1>

      {loading ? (
        <div className="text-center py-12 text-white/40">
          {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : (
        <div className="space-y-3">
          {(settings ?? []).map((s) => {
            const isEditing = s.key in edits;
            const currentText = isEditing ? edits[s.key] : displayValue(s.value);

            return (
              <Card key={s.key}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono text-electric mb-2">{s.key}</div>
                    {isEditing ? (
                      <textarea
                        rows={currentText.includes('\n') ? 6 : 2}
                        value={currentText}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [s.key]: e.target.value }))}
                        className="w-full bg-white/5 border border-electric/40 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none resize-y"
                      />
                    ) : (
                      <pre className="text-xs text-white/50 whitespace-pre-wrap break-all font-mono max-h-24 overflow-y-auto">
                        {currentText}
                      </pre>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {isEditing ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={saving === s.key}
                          onClick={() => handleSave(s.key)}
                        >
                          {saving === s.key ? '...' : lang === 'ar' ? 'حفظ' : 'Save'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEdits((prev) => { const next = { ...prev }; delete next[s.key]; return next; })}
                        >
                          {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEdits((prev) => ({ ...prev, [s.key]: displayValue(s.value) }))}
                      >
                        {lang === 'ar' ? 'تعديل' : 'Edit'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {(settings ?? []).length === 0 && (
            <Card>
              <p className="text-center text-white/40 py-4">
                {lang === 'ar' ? 'لا توجد إعدادات بعد' : 'No settings yet. Run the seed SQL to populate app_settings.'}
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
