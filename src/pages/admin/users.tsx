import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { supabase } from '../../lib/supabase';
import { useLocalQuery } from '../../lib/useData';
import toast from 'react-hot-toast';
import type { Profile } from '../../types';

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: users, loading, refetch } = useLocalQuery<Profile[]>(async () => {
    let query = supabase
      .from('profiles')
      .select('id, username, avatar_url, points, level, role, country, created_at')
      .order('points', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search.trim()) {
      query = query.ilike('username', `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Profile[];
  }, [page, search]);

  const toggleRole = async (user: Profile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setTogglingId(user.id);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id);
    if (error) {
      toast.error('Failed to update role');
    } else {
      toast.success(`${user.username} is now ${newRole}`);
      refetch();
    }
    setTogglingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">👥 {t('admin.users')}</h1>
      </div>

      <input
        type="text"
        placeholder={lang === 'ar' ? 'ابحث باسم المستخدم...' : 'Search by username...'}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-electric"
      />

      {loading ? (
        <div className="text-center py-12 text-white/40">
          {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 border-b border-white/10">
                    <th className="text-left py-3 px-2">User</th>
                    <th className="text-left py-3 px-2">Points</th>
                    <th className="text-left py-3 px-2">Level</th>
                    <th className="text-left py-3 px-2">Country</th>
                    <th className="text-left py-3 px-2">Role</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(users ?? []).map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {u.avatar_url
                            ? <img src={u.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                            : <div className="w-8 h-8 rounded-full bg-electric/20 flex items-center justify-center text-xs font-bold">{u.username?.[0]?.toUpperCase()}</div>
                          }
                          <span className="font-medium">{u.username}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gold font-bold">{(u.points ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-2 text-white/60">Lv {u.level ?? 1}</td>
                      <td className="py-3 px-2 text-white/60">{u.country ?? '—'}</td>
                      <td className="py-3 px-2">
                        <span className={`text-xs px-2 py-1 rounded-lg ${u.role === 'admin' ? 'bg-electric/20 text-electric' : 'bg-white/10 text-white/50'}`}>
                          {u.role ?? 'user'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={togglingId === u.id}
                          onClick={() => toggleRole(u)}
                        >
                          {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(users ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-white/30">
                        {lang === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {(users ?? []).map((u) => (
              <Card key={u.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {u.avatar_url
                      ? <img src={u.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                      : <div className="w-9 h-9 rounded-full bg-electric/20 flex items-center justify-center text-sm font-bold">{u.username?.[0]?.toUpperCase()}</div>
                    }
                    <div>
                      <div className="text-sm font-medium">{u.username}</div>
                      <div className="text-[10px] text-white/40">{u.country ?? ''} · Lv {u.level ?? 1}</div>
                    </div>
                  </div>
                  <span className="text-gold font-bold text-sm">{(u.points ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <span className={`text-xs px-2 py-1 rounded-lg ${u.role === 'admin' ? 'bg-electric/20 text-electric' : 'bg-white/10 text-white/50'}`}>
                    {u.role ?? 'user'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={togglingId === u.id}
                    onClick={() => toggleRole(u)}
                  >
                    {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                  </Button>
                </div>
              </Card>
            ))}
            {(users ?? []).length === 0 && (
              <div className="text-center py-8 text-white/30">
                {lang === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              ← {lang === 'ar' ? 'السابق' : 'Prev'}
            </Button>
            <span className="text-white/40 text-sm">
              {lang === 'ar' ? `صفحة ${page + 1}` : `Page ${page + 1}`}
            </span>
            <Button variant="ghost" size="sm" disabled={(users?.length ?? 0) < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}>
              {lang === 'ar' ? 'التالي' : 'Next'} →
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
