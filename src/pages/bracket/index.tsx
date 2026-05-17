import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { allMatches } from '../../lib/matchSchedule';

const stageOrder = ['round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final'];
const stageLabels: Record<string, { en: string; ar: string }> = {
  round_of_16: { en: 'Round of 16', ar: 'دور الـ 16' },
  quarter_final: { en: 'Quarter Finals', ar: 'ربع النهائي' },
  semi_final: { en: 'Semi Finals', ar: 'نصف النهائي' },
  third_place: { en: 'Third Place', ar: 'المركز الثالث' },
  final: { en: 'Final', ar: 'النهائي' },
};

export default function BracketPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">
          {lang === 'ar' ? 'شجرة البطولة' : 'Tournament Bracket'}
        </h1>
        <p className="text-sm text-white-50">
          {lang === 'ar' ? 'مرحلة خروج المغلوب' : 'Knockout Stage'}
        </p>
      </motion.div>

      {/* Bracket visualization */}
      <div className="space-y-8 overflow-x-auto pb-4">
        {stageOrder.map((stage, si) => {
          const matches = allMatches.filter(m => m.stage === stage);
          if (matches.length === 0) return null;
          const label = stageLabels[stage];

          return (
            <motion.div key={stage} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.15 }}>
              {/* Stage Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-electric/30 to-transparent" />
                <div className="text-sm font-bold text-electric uppercase tracking-widest">
                  {lang === 'ar' ? label.ar : label.en}
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-electric/30 to-transparent" />
              </div>

              {/* Matches */}
              <div className={`grid gap-3 ${stage === 'final' || stage === 'third_place' ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-2 md:grid-cols-4'}`}>
                {matches.map((match, i) => {
                  const date = new Date(match.kickoff_at);
                  return (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: si * 0.1 + i * 0.05 }}
                    >
                      <Card className="p-3 text-center relative overflow-hidden">
                        {/* Connector line */}
                        {stage !== 'final' && stage !== 'third_place' && (
                          <div className="absolute -bottom-4 left-1/2 w-px h-4 bg-white/10" />
                        )}

                        <div className="text-[10px] text-white/30 mb-2">
                          {date.toLocaleDateString()}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 text-right">
                            <div className="text-lg mb-1">{match.team_a?.flag_emoji}</div>
                            <div className="text-xs font-medium truncate">
                              {lang === 'ar' ? match.team_a?.name_ar : match.team_a?.name_en}
                            </div>
                          </div>
                          <div className="text-[10px] text-white/30 font-mono">vs</div>
                          <div className="flex-1 text-left">
                            <div className="text-lg mb-1">{match.team_b?.flag_emoji}</div>
                            <div className="text-xs font-medium truncate">
                              {lang === 'ar' ? match.team_b?.name_ar : match.team_b?.name_en}
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-white/20 mt-1">{match.venue}</div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Match count */}
      <Card className="text-center p-4">
        <div className="text-xs text-white/40 uppercase tracking-wider">
          {lang === 'ar' ? 'عدد مباريات خروج المغلوب' : 'Knockout Matches'}
        </div>
        <div className="text-3xl font-bold text-gold">16</div>
        <div className="text-xs text-white/30 mt-1">
          8 (R16) + 4 (QF) + 2 (SF) + 1 (3rd) + 1 (Final)
        </div>
      </Card>
    </div>
  );
}
