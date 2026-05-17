import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useSponsors } from '../../lib/useData';
import { useCreateSponsor, useUpdateSponsor, useDeleteSponsor } from '../../lib/useMutations';
import type { Sponsor } from '../../types';

type SponsorForm = Omit<Sponsor, 'id'>;

export default function AdminSponsors() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const { data: sponsors, refetch } = useSponsors();
  const createS = useCreateSponsor();
  const updateS = useUpdateSponsor();
  const deleteS = useDeleteSponsor();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [form, setForm] = useState<SponsorForm>({ name: '', description: '', whatsapp: '', instagram: '', location: '', active: true });

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', whatsapp: '', instagram: '', location: '', active: true }); setModalOpen(true); };
  const openEdit = (s: Sponsor) => { setEditing(s); setForm({ name: s.name, description: s.description || '', whatsapp: s.whatsapp || '', instagram: s.instagram || '', location: s.location || '', active: s.active ?? true }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) return;
    if (editing) { await updateS.mutate(editing.id, form); } else { await createS.mutate(form); }
    refetch(); setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (lang === 'ar' ? !confirm('تأكيد الحذف؟') : !confirm('Confirm deletion?')) return;
    await deleteS.mutate(id); refetch();
  };

  const items: Sponsor[] = sponsors?.length ? sponsors : [
    { id: '1', name: 'Café de Beyrouth', description: 'Premium coffee', whatsapp: '+961...', instagram: '@cafe', location: 'Beirut', active: true },
    { id: '2', name: 'Grill House', description: 'Best grilled meat', whatsapp: '+961...', instagram: '@grill', location: 'Hamra', active: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🤝 {t('admin.sponsors')}</h1>
        <Button variant="primary" size="sm" onClick={openCreate}>+ {lang === 'ar' ? 'إضافة' : 'Add'}</Button>
      </div>

      <Card>
        {items.map((s, i) => (
          <div key={s.id || i} className="flex items-center justify-between py-3 px-3 border-b border-white/5 last:border-0">
            <div>
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-white/40">{s.description} · {s.location}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-neon/10 text-neon px-2 py-1 rounded-lg">{s.active ? 'active' : 'inactive'}</span>
              <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                {lang === 'ar' ? 'تعديل' : 'Edit'}
              </Button>
              <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(s.id)}>
                {lang === 'ar' ? 'حذف' : 'Del'}
              </Button>
            </div>
          </div>
        ))}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? (lang === 'ar' ? 'تعديل راعي' : 'Edit Sponsor') : (lang === 'ar' ? 'إضافة راعي' : 'Add Sponsor')}>
        <div className="space-y-3">
          {(['name', 'description', 'whatsapp', 'instagram', 'location'] as Array<keyof SponsorForm>).map((f) => (
            <div key={f}>
              <label className="text-xs text-white/50 block mb-1 capitalize">{f}</label>
              <input value={String(form[f] ?? '')} onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value } as SponsorForm))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-electric" />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button variant="primary" className="flex-1" onClick={handleSave} disabled={createS.loading}>
              {createS.loading ? '...' : (editing ? (lang === 'ar' ? 'تحديث' : 'Update') : (lang === 'ar' ? 'إنشاء' : 'Create'))}
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
