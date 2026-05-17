import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { allTeams } from '../../lib/teams';

export default function AdminTeams() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🏳️ {t('admin.teams')}</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {allTeams.map((team) => (
          <Card key={team.fifa_code} className="p-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{team.flag_emoji}</span>
              <div>
                <div className="text-sm font-medium">{lang === 'ar' ? team.name_ar : team.name_en}</div>
                <div className="text-xs text-white/40">Group {team.group_name}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
