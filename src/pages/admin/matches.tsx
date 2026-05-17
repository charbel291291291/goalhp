import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { allTeams } from '../../lib/teams';
import { allMatches } from '../../lib/matchSchedule';
import { useCreateMatch, useUpdateMatch, useDeleteMatch } from '../../lib/useMutations';
import toast from 'react-hot-toast';
import type { Match } from '../../types';

type MatchForm = Omit<Match, 'id' | 'team_a' | 'team_b'>;

export default function AdminMatches() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const createM = useCreateMatch();
  const updateM = useUpdateMatch();
  const deleteM = useDeleteMatch();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState<MatchForm>({
    match_number: 0, stage: 'group', group_name: 'A', team_a_id: '',
    team_b_id: '', kickoff_at: '', venue: '', status: 'scheduled' as const, locked: false,
  });

  const matches = allMatches.slice(0, 48);

  const openCreate = () => {
    setEditing(null);
    setForm({ match_number: matches.length + 1, stage: 'group', group_name: 'A', team_a_id: '', team_b_id: '', kickoff_at: '', venue: '', status: 'scheduled', locked: false });
    setModalOpen(true);
  };

  const openEdit = (m: Match) => {
    setEditing(m);
    setForm({
      match_number: m.match_number, stage: m.stage, group_name: m.group_name,
      team_a_id: m.team_a_id, team_b_id: m.team_b_id,
      kickoff_at: m.kickoff_at?.slice(0, 16) || '', venue: m.venue || '', status: m.status || 'scheduled', locked: m.locked || false,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.team_a_id || !form.team_b_id || !form.kickoff_at) {
      toast.error(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    if (editing) {
      await updateM.mutate(editing.id, form);
    } else {
      await createM.mutate(form);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (lang === 'ar' ? !confirm('تأكيد الحذف؟') : !confirm('Confirm deletion?')) return;
    await deleteM.mutate(id);
  };

  const stageLabel = (s: string) => {
    const labels: Record<string, string> = { group: 'Group', round_of_16: 'R16', quarter_final: 'QF', semi_final: 'SF', third_place: '3rd', final: 'Final' };
    return labels[s] || s;
  };

  const filtered = filter === 'all' ? matches : matches.filter(m => m.stage === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">⚽ {t('admin.matches')}</h1>
        <Button variant="primary" size="sm" onClick={openCreate}>+ {lang === 'ar' ? 'إضافة' : 'Add'}</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {['all', 'group', 'round_of_16', 'quarter_final', 'semi_final', 'final'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
              filter === s ? 'bg-electric/20 text-electric' : 'bg-white/5 hover:bg-white/10 text-white/60'
            }`}>
            {s === 'all' ? (lang === 'ar' ? 'الكل' : 'All') : stageLabel(s)}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 border-b border-white/10">
                <th className="text-left py-2 px-2 text-xs">#</th>
                <th className="text-left py-2 px-2 text-xs">Stage</th>
                <th className="text-left py-2 px-2 text-xs">{lang === 'ar' ? 'الفريق أ' : 'Team A'}</th>
                <th className="text-left py-2 px-2 text-xs">{lang === 'ar' ? 'الفريق ب' : 'Team B'}</th>
                <th className="text-left py-2 px-2 text-xs">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th className="text-left py-2 px-2 text-xs">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-2 text-xs text-white/40">{m.match_number}</td>
                  <td className="py-2 px-2 text-xs">{stageLabel(m.stage)}{m.group_name ? ` ${m.group_name}` : ''}</td>
                  <td className="py-2 px-2">
                    <span className="text-xs">{m.team_a?.flag_emoji} {lang === 'ar' ? m.team_a?.name_ar : m.team_a?.name_en}</span>
                  </td>
                  <td className="py-2 px-2">
                    <span className="text-xs">{m.team_b?.flag_emoji} {lang === 'ar' ? m.team_b?.name_ar : m.team_b?.name_en}</span>
                  </td>
                  <td className="py-2 px-2 text-xs text-white/40">
                    {new Date(m.kickoff_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                        {lang === 'ar' ? 'تعديل' : 'Edit'}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(m.id)}>
                        {lang === 'ar' ? 'حذف' : 'Del'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.map((m) => (
          <Card key={m.id} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">#{m.match_number}</span>
              <span className="text-[10px] text-white/40">{stageLabel(m.stage)}{m.group_name ? ` ${m.group_name}` : ''}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{m.team_a?.flag_emoji}</span>
                <span className="text-xs font-medium">{lang === 'ar' ? m.team_a?.name_ar : m.team_a?.name_en}</span>
              </div>
              <span className="text-[10px] text-white/30">VS</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium">{lang === 'ar' ? m.team_b?.name_ar : m.team_b?.name_en}</span>
                <span className="text-lg">{m.team_b?.flag_emoji}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <span className="text-[10px] text-white/40">{new Date(m.kickoff_at).toLocaleDateString()}</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(m)}
                  className="text-[10px] px-2 py-1 rounded bg-white/5 text-white/60 hover:text-white">{lang === 'ar' ? 'تعديل' : 'Edit'}</button>
                <button onClick={() => handleDelete(m.id)}
                  className="text-[10px] px-2 py-1 rounded bg-white/5 text-red-400">{lang === 'ar' ? 'حذف' : 'Del'}</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? (lang === 'ar' ? 'تعديل مباراة' : 'Edit Match') : (lang === 'ar' ? 'إضافة مباراة' : 'Add Match')}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-white/50 block mb-1">{lang === 'ar' ? 'المرحلة' : 'Stage'}</label>
              <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                <option value="group">Group Stage</option>
                <option value="round_of_16">Round of 16</option>
                <option value="quarter_final">Quarter Final</option>
                <option value="semi_final">Semi Final</option>
                <option value="third_place">Third Place</option>
                <option value="final">Final</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">{lang === 'ar' ? 'المجموعة' : 'Group'}</label>
              <select value={form.group_name} onChange={e => setForm(p => ({ ...p, group_name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                {'ABCDEFGHIJKL'.split('').map(g => <option key={g} value={g}>Group {g}</option>)}
                <option value="">—</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">{lang === 'ar' ? 'الفريق أ' : 'Team A'}</label>
            <select value={form.team_a_id} onChange={e => setForm(p => ({ ...p, team_a_id: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
              <option value="">—</option>
              {allTeams.map(t => (
                <option key={t.fifa_code} value={t.fifa_code}>{t.flag_emoji} {lang === 'ar' ? t.name_ar : t.name_en}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">{lang === 'ar' ? 'الفريق ب' : 'Team B'}</label>
            <select value={form.team_b_id} onChange={e => setForm(p => ({ ...p, team_b_id: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
              <option value="">—</option>
              {allTeams.filter(t => t.fifa_code !== form.team_a_id).map(t => (
                <option key={t.fifa_code} value={t.fifa_code}>{t.flag_emoji} {lang === 'ar' ? t.name_ar : t.name_en}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">{lang === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</label>
            <input type="datetime-local" value={form.kickoff_at} onChange={e => setForm(p => ({ ...p, kickoff_at: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">{lang === 'ar' ? 'الملعب' : 'Venue'}</label>
            <input value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="primary" className="flex-1" onClick={handleSave} disabled={createM.loading || updateM.loading}>
              {createM.loading || updateM.loading ? '...' : (editing ? (lang === 'ar' ? 'تحديث' : 'Update') : (lang === 'ar' ? 'إنشاء' : 'Create'))}
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
