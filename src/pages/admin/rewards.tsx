import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useCreateReward, useUpdateReward, useDeleteReward } from '../../lib/useMutations';
import type { Reward } from '../../types';

type RewardForm = Omit<Reward, 'id' | 'sponsor'>;
type RewardListItem = Pick<Reward, 'id' | 'title_en' | 'title_ar' | 'points_required' | 'quantity'> & { sponsor_name: string };

export default function AdminRewards() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const createR = useCreateReward();
  const updateR = useUpdateReward();
  const deleteR = useDeleteReward();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [form, setForm] = useState<RewardForm>({
    sponsor_id: '', title_en: '', title_ar: '', description_en: '', description_ar: '',
    points_required: 100, quantity: 10, expiry_date: '', terms_en: '', terms_ar: '', active: true,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ sponsor_id: '', title_en: '', title_ar: '', description_en: '', description_ar: '', points_required: 100, quantity: 10, expiry_date: '', terms_en: '', terms_ar: '', active: true });
    setModalOpen(true);
  };
  const openEdit = (r: Reward) => {
    setEditing(r);
    setForm({ sponsor_id: r.sponsor_id || '', title_en: r.title_en || '', title_ar: r.title_ar || '', description_en: r.description_en || '', description_ar: r.description_ar || '', points_required: r.points_required || 100, quantity: r.quantity || 10, expiry_date: r.expiry_date || '', terms_en: r.terms_en || '', terms_ar: r.terms_ar || '', active: r.active ?? true });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title_en || !form.points_required) return;
    if (editing) { await updateR.mutate(editing.id, form); } else { await createR.mutate(form); }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (lang === 'ar' ? !confirm('تأكيد الحذف؟') : !confirm('Confirm deletion?')) return;
    await deleteR.mutate(id);
  };

  const items: RewardListItem[] = [
    { id: '1', sponsor_name: 'Café de Beyrouth', title_en: 'Free Lebanese Coffee', title_ar: 'قهوة لبنانية مجانية', points_required: 500, quantity: 50 },
    { id: '2', sponsor_name: 'Grill House', title_en: '20% Off Mixed Grill', title_ar: 'خصم 20% على المشاوي', points_required: 800, quantity: 30 },
    { id: '3', sponsor_name: 'Fashion Hub', title_en: 'VIP Shopping Pass', title_ar: 'بطاقة تسوق VIP', points_required: 1500, quantity: 20 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🎁 {t('admin.rewards')}</h1>
        <Button variant="primary" size="sm" onClick={openCreate}>+ {lang === 'ar' ? 'إضافة' : 'Add'}</Button>
      </div>

      <Card>
        {items.map((r) => (
          <div key={r.id} className="flex items-center justify-between py-3 px-3 border-b border-white/5 last:border-0">
            <div>
              <div className="text-sm font-medium">{lang === 'ar' ? r.title_ar : r.title_en}</div>
              <div className="text-xs text-white/40">{r.sponsor_name} · {r.points_required} pts · {r.quantity} left</div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                {lang === 'ar' ? 'تعديل' : 'Edit'}
              </Button>
              <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(r.id)}>
                {lang === 'ar' ? 'حذف' : 'Del'}
              </Button>
            </div>
          </div>
        ))}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? (lang === 'ar' ? 'تعديل مكافأة' : 'Edit Reward') : (lang === 'ar' ? 'إضافة مكافأة' : 'Add Reward')}>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {([
            { field: 'title_en', label: 'Title (English)' },
            { field: 'title_ar', label: 'Title (Arabic)' },
            { field: 'description_en', label: 'Description (English)', area: true },
            { field: 'description_ar', label: 'Description (Arabic)', area: true },
          ] as Array<{ field: keyof RewardForm; label: string; area?: boolean }>).map((f) => (
            <div key={String(f.field)}>
              <label className="text-xs text-white/50 block mb-1">{f.label}</label>
              {f.area ? (
                <textarea value={String(form[f.field] ?? '')} onChange={(e) => setForm((p) => ({ ...p, [f.field]: e.target.value } as RewardForm))}
                  rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-electric" />
              ) : (
                <input value={String(form[f.field] ?? '')} onChange={(e) => setForm((p) => ({ ...p, [f.field]: e.target.value } as RewardForm))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-electric" />
              )}
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-white/50 block mb-1">Points Required</label>
              <input type="number" value={form.points_required} onChange={e => setForm(p => ({ ...p, points_required: +e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Quantity</label>
              <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: +e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">Expiry Date</label>
            <input type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="primary" className="flex-1" onClick={handleSave} disabled={createR.loading}>
              {createR.loading ? '...' : (editing ? (lang === 'ar' ? 'تحديث' : 'Update') : (lang === 'ar' ? 'إنشاء' : 'Create'))}
            </Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
