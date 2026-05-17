import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export default function AdminUsers() {
  const { t } = useTranslation();

  const users = [1, 2, 3, 4, 5];
  const scoreFor = (index: number) => ((index + 1) * 1379) % 10000;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">👥 {t('admin.users')}</h1>
        <Button variant="primary" size="sm">Export</Button>
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 border-b border-white/10">
                <th className="text-left py-3 px-2">User</th>
                <th className="text-left py-3 px-2">Team</th>
                <th className="text-left py-3 px-2">Points</th>
                <th className="text-left py-3 px-2">Role</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((i, idx) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-electric/20 flex items-center justify-center text-xs">U{i}</div>
                      <span>User_{i}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">🇧🇷</td>
                  <td className="py-3 px-2 text-gold">{scoreFor(idx)}</td>
                  <td className="py-3 px-2">
                    <span className="text-xs bg-white/10 px-2 py-1 rounded-lg">user</span>
                  </td>
                  <td className="py-3 px-2">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {users.map((i, idx) => (
          <Card key={i} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-electric/20 flex items-center justify-center text-sm font-bold">U{i}</div>
                <div>
                  <div className="text-sm font-medium">User_{i}</div>
                  <div className="text-[10px] text-white/40">Joined recently</div>
                </div>
              </div>
              <span className="text-gold font-bold text-sm">{scoreFor(idx)}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <span className="text-xs bg-white/10 px-2 py-1 rounded-lg">🇧🇷 user</span>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
