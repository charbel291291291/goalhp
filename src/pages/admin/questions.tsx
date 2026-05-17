import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useQuestions } from '../../lib/useData';
import { useCreateQuestion, useUpdateQuestion, useDeleteQuestion } from '../../lib/useMutations';
import { sampleQuestions } from '../../lib/sampleQuestions';
import type { QuizQuestion } from '../../types';

type QuestionDifficulty = 'easy' | 'medium' | 'hard';

const emptyForm: {
  category_id: string;
  question_en: string;
  question_ar: string;
  answers_en: string[];
  answers_ar: string[];
  correct_answer_index: number;
  difficulty: QuestionDifficulty;
  explanation_en: string;
  explanation_ar: string;
} = {
  category_id: '', question_en: '', question_ar: '',
  answers_en: ['', '', '', ''], answers_ar: ['', '', '', ''],
  correct_answer_index: 0, difficulty: 'easy', explanation_en: '', explanation_ar: '',
};

export default function AdminQuestions() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const { data: questions, refetch } = useQuestions();
  const createQ = useCreateQuestion();
  const updateQ = useUpdateQuestion();
  const deleteQ = useDeleteQuestion();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QuizQuestion | null>(null);
  const [form, setForm] = useState(emptyForm);

  const allQuestions = questions?.length ? questions : sampleQuestions;

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (q: QuizQuestion) => {
    setEditing(q);
    setForm({
      category_id: q.category_id || '',
      question_en: q.question_en || '',
      question_ar: q.question_ar || '',
      answers_en: q.answers_en || ['', '', '', ''],
      answers_ar: q.answers_ar || ['', '', '', ''],
      correct_answer_index: q.correct_answer_index || 0,
      difficulty: q.difficulty || 'easy',
      explanation_en: q.explanation_en || '',
      explanation_ar: q.explanation_ar || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await updateQ.mutate(editing.id, form);
    } else {
      await createQ.mutate(form);
    }
    refetch();
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (lang === 'ar' ? !confirm('تأكيد الحذف؟') : !confirm('Confirm deletion?')) return;
    await deleteQ.mutate(id);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">❓ {t('admin.questions')}</h1>
        <Button variant="primary" size="sm" onClick={openCreate}>+ {lang === 'ar' ? 'إضافة' : 'Add'}</Button>
      </div>

      <Card>
        <div className="space-y-2">
          {allQuestions.map((q, i) => (
            <div key={q.id || i} className="flex items-center justify-between py-3 px-3 border-b border-white/5 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{lang === 'ar' ? q.question_ar : q.question_en}</div>
                <div className="text-xs text-white/40">{q.difficulty}</div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>
                  {lang === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
                <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(q.id)}>
                  {lang === 'ar' ? 'حذف' : 'Delete'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Question Form Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? (lang === 'ar' ? 'تعديل سؤال' : 'Edit Question') : (lang === 'ar' ? 'إضافة سؤال' : 'Add Question')}>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/50 block mb-1">{lang === 'ar' ? 'السؤال (إنجليزي)' : 'Question (English)'}</label>
            <input value={form.question_en} onChange={e => setForm(p => ({ ...p, question_en: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-electric" />
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">{lang === 'ar' ? 'السؤال (عربي)' : 'Question (Arabic)'}</label>
            <input value={form.question_ar} onChange={e => setForm(p => ({ ...p, question_ar: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-electric" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i}>
                <label className="text-xs text-white/50 block mb-1">Answer {i + 1} (EN)</label>
                <input value={form.answers_en[i]} onChange={e => {
                  const a = [...form.answers_en]; a[i] = e.target.value; setForm(p => ({ ...p, answers_en: a }));
                }}
                  className={`w-full bg-white/5 border rounded-xl px-3 py-2 text-sm text-white focus:outline-none ${
                    form.correct_answer_index === i ? 'border-neon' : 'border-white/10 focus:border-electric'
                  }`} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">{lang === 'ar' ? 'الإجابة الصحيحة' : 'Correct Answer'}</label>
            <select value={form.correct_answer_index} onChange={e => setForm(p => ({ ...p, correct_answer_index: +e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
              {[0, 1, 2, 3].map(i => <option key={i} value={i}>
                {lang === 'ar' ? `الإجابة ${i + 1}` : `Answer ${i + 1}`}: {form.answers_en[i] || `Option ${i + 1}`}
              </option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">{lang === 'ar' ? 'الصعوبة' : 'Difficulty'}</label>
            <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value as QuestionDifficulty }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="primary" className="flex-1" onClick={handleSave} disabled={createQ.loading || updateQ.loading}>
              {createQ.loading || updateQ.loading ? '...' : (editing ? (lang === 'ar' ? 'تحديث' : 'Update') : (lang === 'ar' ? 'إنشاء' : 'Create'))}
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
