import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';

const tabs = ['global', 'daily', 'weekly', 'team', 'region', 'friends'] as const;

const mockPlayers = [
  { rank: 1, name: 'CristianoFan', flag: '🇵🇹', team: 'Portugal', points: 12500, region: 'Beirut' },
  { rank: 2, name: 'MessiGOAT', flag: '🇦🇷', team: 'Argentina', points: 11800, region: 'Mount Lebanon' },
  { rank: 3, name: 'LebanonStar', flag: '🇱🇧', team: 'Lebanon', points: 10200, region: 'Tripoli' },
  { rank: 4, name: 'BrazilKing', flag: '🇧🇷', team: 'Brazil', points: 9800, region: 'Saida' },
  { rank: 5, name: 'AtlasLion', flag: '🇲🇦', team: 'Morocco', points: 9100, region: 'Beirut' },
  { rank: 6, name: 'GermanMachine', flag: '🇩🇪', team: 'Germany', points: 8700, region: 'Zahle' },
  { rank: 7, name: 'ThreeLions', flag: '🏴', team: 'England', points: 8200, region: 'Jounieh' },
  { rank: 8, name: 'OranjeFever', flag: '🇳🇱', team: 'Netherlands', points: 7900, region: 'Nabatieh' },
];

export default function LeaderboardIndex() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('global');
  const lang = i18n.language as 'en' | 'ar';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">{t('leaderboard.global')}</h1>
        <p className="text-sm text-white/50">{lang === 'ar' ? 'تصنيف اللاعبين حول العالم' : 'Player rankings around the world'}</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
              activeTab === tab ? 'bg-electric text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {t(`leaderboard.${tab}`)}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <Card>
        <div className="space-y-1">
          {mockPlayers.map((player, i) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 text-center font-bold ${
                  player.rank === 1 ? 'text-gold text-lg' :
                  player.rank === 2 ? 'text-white/70 text-lg' :
                  player.rank === 3 ? 'text-gold/60 text-lg' :
                  'text-white/30'
                }`}>
                  #{player.rank}
                </span>
                <span className="text-xl">{player.flag}</span>
                <div>
                  <div className="text-sm font-medium">{player.name}</div>
                  <div className="text-[10px] text-white/40">{player.team} · {player.region}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gold font-bold text-sm">{player.points.toLocaleString()}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
