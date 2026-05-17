import type { Match, Team } from '../types';

interface TeamSimple { name_en: string; name_ar: string; flag_emoji: string; fifa_code: string; group_name: string; primary_color: string; secondary_color: string; }

const teams: TeamSimple[] = [
  { name_en: 'Mexico', name_ar: 'المكسيك', flag_emoji: '🇲🇽', fifa_code: 'MEX', group_name: 'A', primary_color: '#006847', secondary_color: '#CE1126' },
  { name_en: 'South Africa', name_ar: 'جنوب أفريقيا', flag_emoji: '🇿🇦', fifa_code: 'RSA', group_name: 'A', primary_color: '#007A4D', secondary_color: '#FFB612' },
  { name_en: 'Korea Republic', name_ar: 'كوريا الجنوبية', flag_emoji: '🇰🇷', fifa_code: 'KOR', group_name: 'A', primary_color: '#C60C30', secondary_color: '#003478' },
  { name_en: 'Czechia', name_ar: 'التشيك', flag_emoji: '🇨🇿', fifa_code: 'CZE', group_name: 'A', primary_color: '#11457E', secondary_color: '#D7141A' },
  { name_en: 'Canada', name_ar: 'كندا', flag_emoji: '🇨🇦', fifa_code: 'CAN', group_name: 'B', primary_color: '#FF0000', secondary_color: '#FFFFFF' },
  { name_en: 'Bosnia and Herzegovina', name_ar: 'البوسنة والهرسك', flag_emoji: '🇧🇦', fifa_code: 'BIH', group_name: 'B', primary_color: '#001B3D', secondary_color: '#FFD100' },
  { name_en: 'Qatar', name_ar: 'قطر', flag_emoji: '🇶🇦', fifa_code: 'QAT', group_name: 'B', primary_color: '#8C1B40', secondary_color: '#FFFFFF' },
  { name_en: 'Switzerland', name_ar: 'سويسرا', flag_emoji: '🇨🇭', fifa_code: 'SUI', group_name: 'B', primary_color: '#FF0000', secondary_color: '#FFFFFF' },
  { name_en: 'Brazil', name_ar: 'البرازيل', flag_emoji: '🇧🇷', fifa_code: 'BRA', group_name: 'C', primary_color: '#009739', secondary_color: '#FFDF00' },
  { name_en: 'Morocco', name_ar: 'المغرب', flag_emoji: '🇲🇦', fifa_code: 'MAR', group_name: 'C', primary_color: '#C1272D', secondary_color: '#006233' },
  { name_en: 'Haiti', name_ar: 'هايتي', flag_emoji: '🇭🇹', fifa_code: 'HAI', group_name: 'C', primary_color: '#00209F', secondary_color: '#D21034' },
  { name_en: 'Scotland', name_ar: 'اسكتلندا', flag_emoji: '🏴', fifa_code: 'SCO', group_name: 'C', primary_color: '#003876', secondary_color: '#FFFFFF' },
  { name_en: 'USA', name_ar: 'الولايات المتحدة', flag_emoji: '🇺🇸', fifa_code: 'USA', group_name: 'D', primary_color: '#3C3B6E', secondary_color: '#B22234' },
  { name_en: 'Paraguay', name_ar: 'باراغواي', flag_emoji: '🇵🇾', fifa_code: 'PAR', group_name: 'D', primary_color: '#D52B1E', secondary_color: '#0038A8' },
  { name_en: 'Australia', name_ar: 'أستراليا', flag_emoji: '🇦🇺', fifa_code: 'AUS', group_name: 'D', primary_color: '#00843D', secondary_color: '#FFCD00' },
  { name_en: 'Türkiye', name_ar: 'تركيا', flag_emoji: '🇹🇷', fifa_code: 'TUR', group_name: 'D', primary_color: '#E30A17', secondary_color: '#FFFFFF' },
  { name_en: 'Germany', name_ar: 'ألمانيا', flag_emoji: '🇩🇪', fifa_code: 'GER', group_name: 'E', primary_color: '#000000', secondary_color: '#DD0000' },
  { name_en: 'Curaçao', name_ar: 'كوراساو', flag_emoji: '🇨🇼', fifa_code: 'CUW', group_name: 'E', primary_color: '#003893', secondary_color: '#FED141' },
  { name_en: 'Côte d\'Ivoire', name_ar: 'ساحل العاج', flag_emoji: '🇨🇮', fifa_code: 'CIV', group_name: 'E', primary_color: '#F77F00', secondary_color: '#009E60' },
  { name_en: 'Ecuador', name_ar: 'الإكوادور', flag_emoji: '🇪🇨', fifa_code: 'ECU', group_name: 'E', primary_color: '#FFD100', secondary_color: '#003893' },
  { name_en: 'Netherlands', name_ar: 'هولندا', flag_emoji: '🇳🇱', fifa_code: 'NED', group_name: 'F', primary_color: '#FF6600', secondary_color: '#FFFFFF' },
  { name_en: 'Japan', name_ar: 'اليابان', flag_emoji: '🇯🇵', fifa_code: 'JPN', group_name: 'F', primary_color: '#BC002D', secondary_color: '#FFFFFF' },
  { name_en: 'Tunisia', name_ar: 'تونس', flag_emoji: '🇹🇳', fifa_code: 'TUN', group_name: 'F', primary_color: '#E70013', secondary_color: '#FFFFFF' },
  { name_en: 'Sweden', name_ar: 'السويد', flag_emoji: '🇸🇪', fifa_code: 'SWE', group_name: 'F', primary_color: '#005B9F', secondary_color: '#FECC00' },
  { name_en: 'Belgium', name_ar: 'بلجيكا', flag_emoji: '🇧🇪', fifa_code: 'BEL', group_name: 'G', primary_color: '#FFD700', secondary_color: '#000000' },
  { name_en: 'Egypt', name_ar: 'مصر', flag_emoji: '🇪🇬', fifa_code: 'EGY', group_name: 'G', primary_color: '#C1272D', secondary_color: '#000000' },
  { name_en: 'IR Iran', name_ar: 'إيران', flag_emoji: '🇮🇷', fifa_code: 'IRN', group_name: 'G', primary_color: '#239F40', secondary_color: '#DA0000' },
  { name_en: 'New Zealand', name_ar: 'نيوزيلندا', flag_emoji: '🇳🇿', fifa_code: 'NZL', group_name: 'G', primary_color: '#000000', secondary_color: '#FFFFFF' },
  { name_en: 'Spain', name_ar: 'إسبانيا', flag_emoji: '🇪🇸', fifa_code: 'ESP', group_name: 'H', primary_color: '#C60B1E', secondary_color: '#FFC400' },
  { name_en: 'Cabo Verde', name_ar: 'الرأس الأخضر', flag_emoji: '🇨🇻', fifa_code: 'CPV', group_name: 'H', primary_color: '#003893', secondary_color: '#CF2027' },
  { name_en: 'Saudi Arabia', name_ar: 'السعودية', flag_emoji: '🇸🇦', fifa_code: 'KSA', group_name: 'H', primary_color: '#006C35', secondary_color: '#FFFFFF' },
  { name_en: 'Uruguay', name_ar: 'الأوروغواي', flag_emoji: '🇺🇾', fifa_code: 'URU', group_name: 'H', primary_color: '#0038A8', secondary_color: '#FFFFFF' },
  { name_en: 'France', name_ar: 'فرنسا', flag_emoji: '🇫🇷', fifa_code: 'FRA', group_name: 'I', primary_color: '#002395', secondary_color: '#FFFFFF' },
  { name_en: 'Senegal', name_ar: 'السنغال', flag_emoji: '🇸🇳', fifa_code: 'SEN', group_name: 'I', primary_color: '#00853F', secondary_color: '#FDEF42' },
  { name_en: 'Iraq', name_ar: 'العراق', flag_emoji: '🇮🇶', fifa_code: 'IRQ', group_name: 'I', primary_color: '#007A3D', secondary_color: '#CE1126' },
  { name_en: 'Norway', name_ar: 'النرويج', flag_emoji: '🇳🇴', fifa_code: 'NOR', group_name: 'I', primary_color: '#BA0C2F', secondary_color: '#FFFFFF' },
  { name_en: 'Argentina', name_ar: 'الأرجنتين', flag_emoji: '🇦🇷', fifa_code: 'ARG', group_name: 'J', primary_color: '#75AADB', secondary_color: '#FFFFFF' },
  { name_en: 'Algeria', name_ar: 'الجزائر', flag_emoji: '🇩🇿', fifa_code: 'ALG', group_name: 'J', primary_color: '#006633', secondary_color: '#FFFFFF' },
  { name_en: 'Austria', name_ar: 'النمسا', flag_emoji: '🇦🇹', fifa_code: 'AUT', group_name: 'J', primary_color: '#ED2939', secondary_color: '#FFFFFF' },
  { name_en: 'Jordan', name_ar: 'الأردن', flag_emoji: '🇯🇴', fifa_code: 'JOR', group_name: 'J', primary_color: '#CE1126', secondary_color: '#000000' },
  { name_en: 'Portugal', name_ar: 'البرتغال', flag_emoji: '🇵🇹', fifa_code: 'POR', group_name: 'K', primary_color: '#006600', secondary_color: '#FF0000' },
  { name_en: 'Colombia', name_ar: 'كولومبيا', flag_emoji: '🇨🇴', fifa_code: 'COL', group_name: 'K', primary_color: '#FCD116', secondary_color: '#003893' },
  { name_en: 'Uzbekistan', name_ar: 'أوزبكستان', flag_emoji: '🇺🇿', fifa_code: 'UZB', group_name: 'K', primary_color: '#1EB53A', secondary_color: '#0099B5' },
  { name_en: 'Congo DR', name_ar: 'الكونغو الديمقراطية', flag_emoji: '🇨🇩', fifa_code: 'COD', group_name: 'K', primary_color: '#007FFF', secondary_color: '#CE1126' },
  { name_en: 'England', name_ar: 'إنجلترا', flag_emoji: '🏴', fifa_code: 'ENG', group_name: 'L', primary_color: '#CF142B', secondary_color: '#FFFFFF' },
  { name_en: 'Croatia', name_ar: 'كرواتيا', flag_emoji: '🇭🇷', fifa_code: 'CRO', group_name: 'L', primary_color: '#FF0000', secondary_color: '#FFFFFF' },
  { name_en: 'Ghana', name_ar: 'غانا', flag_emoji: '🇬🇭', fifa_code: 'GHA', group_name: 'L', primary_color: '#006B3F', secondary_color: '#FCD20A' },
  { name_en: 'Panama', name_ar: 'بنما', flag_emoji: '🇵🇦', fifa_code: 'PAN', group_name: 'L', primary_color: '#00529F', secondary_color: '#CE1126' },
];

const teamMap = new Map(teams.map(t => [t.fifa_code, t]));

function groupMatches(groupName: string, matchNum: number): Array<{
  match_number: number; team_a_fifa: string; team_b_fifa: string; kickoff_at: string; venue: string; stage: string; group_name: string;
}> {
  const gTeams = teams.filter(t => t.group_name === groupName);
  const kickoffBase = new Date('2026-06-11T16:00:00+03:00');
  
  return [
    {
      match_number: matchNum,
      team_a_fifa: gTeams[0].fifa_code,
      team_b_fifa: gTeams[1].fifa_code,
      kickoff_at: new Date(kickoffBase.getTime() + (matchNum - 1) * 86400000).toISOString(),
      venue: 'Estadio Azteca',
      stage: 'group',
      group_name: groupName,
    },
    {
      match_number: matchNum + 1,
      team_a_fifa: gTeams[2].fifa_code,
      team_b_fifa: gTeams[3].fifa_code,
      kickoff_at: new Date(kickoffBase.getTime() + (matchNum) * 86400000).toISOString(),
      venue: 'MetLife Stadium',
      stage: 'group',
      group_name: groupName,
    },
    {
      match_number: matchNum + 2,
      team_a_fifa: gTeams[0].fifa_code,
      team_b_fifa: gTeams[2].fifa_code,
      kickoff_at: new Date(kickoffBase.getTime() + (matchNum + 3) * 86400000).toISOString(),
      venue: 'BC Place',
      stage: 'group',
      group_name: groupName,
    },
    {
      match_number: matchNum + 3,
      team_a_fifa: gTeams[1].fifa_code,
      team_b_fifa: gTeams[3].fifa_code,
      kickoff_at: new Date(kickoffBase.getTime() + (matchNum + 4) * 86400000).toISOString(),
      venue: 'Stadium Azteca',
      stage: 'group',
      group_name: groupName,
    },
    {
      match_number: matchNum + 4,
      team_a_fifa: gTeams[0].fifa_code,
      team_b_fifa: gTeams[3].fifa_code,
      kickoff_at: new Date(kickoffBase.getTime() + (matchNum + 7) * 86400000).toISOString(),
      venue: 'Rose Bowl',
      stage: 'group',
      group_name: groupName,
    },
    {
      match_number: matchNum + 5,
      team_a_fifa: gTeams[1].fifa_code,
      team_b_fifa: gTeams[2].fifa_code,
      kickoff_at: new Date(kickoffBase.getTime() + (matchNum + 8) * 86400000).toISOString(),
      venue: 'Mercedes-Benz Stadium',
      stage: 'group',
      group_name: groupName,
    },
  ];
}

const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const matchNum = 1;
let rawMatches: Array<{
  match_number: number; team_a_fifa: string; team_b_fifa: string; kickoff_at: string; venue: string; stage: string; group_name: string;
}> = [];

groupLetters.forEach((g, i) => {
  const gm = groupMatches(g, matchNum + i * 6);
  rawMatches = [...rawMatches, ...gm];
});

// Add knockout stage matches
const knockoutMatches = [
  { match_number: 73, team_a_fifa: 'BRA', team_b_fifa: 'MEX', kickoff_at: '2026-07-04T17:00:00+03:00', venue: 'Rose Bowl', stage: 'round_of_16', group_name: '' },
  { match_number: 74, team_a_fifa: 'ARG', team_b_fifa: 'CRO', kickoff_at: '2026-07-04T21:00:00+03:00', venue: 'MetLife Stadium', stage: 'round_of_16', group_name: '' },
  { match_number: 75, team_a_fifa: 'ENG', team_b_fifa: 'GER', kickoff_at: '2026-07-05T17:00:00+03:00', venue: 'Mercedes-Benz Stadium', stage: 'round_of_16', group_name: '' },
  { match_number: 76, team_a_fifa: 'FRA', team_b_fifa: 'NED', kickoff_at: '2026-07-05T21:00:00+03:00', venue: 'BC Place', stage: 'round_of_16', group_name: '' },
  { match_number: 77, team_a_fifa: 'POR', team_b_fifa: 'ESP', kickoff_at: '2026-07-06T17:00:00+03:00', venue: 'Estadio Azteca', stage: 'round_of_16', group_name: '' },
  { match_number: 78, team_a_fifa: 'MAR', team_b_fifa: 'BEL', kickoff_at: '2026-07-06T21:00:00+03:00', venue: 'AT&T Stadium', stage: 'round_of_16', group_name: '' },
  { match_number: 79, team_a_fifa: 'COL', team_b_fifa: 'JPN', kickoff_at: '2026-07-07T17:00:00+03:00', venue: 'Levi\'s Stadium', stage: 'round_of_16', group_name: '' },
  { match_number: 80, team_a_fifa: 'URU', team_b_fifa: 'KOR', kickoff_at: '2026-07-07T21:00:00+03:00', venue: 'Gillette Stadium', stage: 'round_of_16', group_name: '' },
  { match_number: 81, team_a_fifa: 'BRA', team_b_fifa: 'CRO', kickoff_at: '2026-07-09T17:00:00+03:00', venue: 'Rose Bowl', stage: 'quarter_final', group_name: '' },
  { match_number: 82, team_a_fifa: 'ENG', team_b_fifa: 'NED', kickoff_at: '2026-07-09T21:00:00+03:00', venue: 'MetLife Stadium', stage: 'quarter_final', group_name: '' },
  { match_number: 83, team_a_fifa: 'POR', team_b_fifa: 'BEL', kickoff_at: '2026-07-10T17:00:00+03:00', venue: 'Mercedes-Benz Stadium', stage: 'quarter_final', group_name: '' },
  { match_number: 84, team_a_fifa: 'COL', team_b_fifa: 'URU', kickoff_at: '2026-07-10T21:00:00+03:00', venue: 'BC Place', stage: 'quarter_final', group_name: '' },
  { match_number: 85, team_a_fifa: 'BRA', team_b_fifa: 'ENG', kickoff_at: '2026-07-14T17:00:00+03:00', venue: 'Estadio Azteca', stage: 'semi_final', group_name: '' },
  { match_number: 86, team_a_fifa: 'POR', team_b_fifa: 'COL', kickoff_at: '2026-07-14T21:00:00+03:00', venue: 'AT&T Stadium', stage: 'semi_final', group_name: '' },
  { match_number: 87, team_a_fifa: 'ENG', team_b_fifa: 'POR', kickoff_at: '2026-07-18T17:00:00+03:00', venue: 'MetLife Stadium', stage: 'third_place', group_name: '' },
  { match_number: 88, team_a_fifa: 'BRA', team_b_fifa: 'COL', kickoff_at: '2026-07-19T18:00:00+03:00', venue: 'MetLife Stadium', stage: 'final', group_name: '' },
];

rawMatches = [...rawMatches, ...knockoutMatches];

export const allMatches: Match[] = rawMatches.map((m): Match => ({
  id: `match-${m.match_number}`,
  match_number: m.match_number,
  stage: m.stage,
  group_name: m.group_name,
  team_a_id: `team-${m.team_a_fifa}`,
  team_b_id: `team-${m.team_b_fifa}`,
  kickoff_at: m.kickoff_at,
  venue: m.venue,
  status: 'scheduled',
  team_a_score: undefined,
  team_b_score: undefined,
  winner_team_id: undefined,
  locked: false,
  team_a: (() => {
    const t = teamMap.get(m.team_a_fifa);
    if (!t) return undefined;
    const team: Team = {
      id: `team-${t.fifa_code}`,
      name_en: t.name_en,
      name_ar: t.name_ar,
      group_name: t.group_name,
      fifa_code: t.fifa_code,
      flag_emoji: t.flag_emoji,
      primary_color: t.primary_color,
      secondary_color: t.secondary_color,
      total_points: 0,
      active: true,
    };
    return team;
  })(),
  team_b: (() => {
    const t = teamMap.get(m.team_b_fifa);
    if (!t) return undefined;
    const team: Team = {
      id: `team-${t.fifa_code}`,
      name_en: t.name_en,
      name_ar: t.name_ar,
      group_name: t.group_name,
      fifa_code: t.fifa_code,
      flag_emoji: t.flag_emoji,
      primary_color: t.primary_color,
      secondary_color: t.secondary_color,
      total_points: 0,
      active: true,
    };
    return team;
  })(),
}));

export const stages = [
  { key: 'all', en: 'All Matches', ar: 'جميع المباريات' },
  { key: 'today', en: 'Today', ar: 'اليوم' },
  { key: 'upcoming', en: 'Upcoming', ar: 'القادمة' },
  { key: 'group', en: 'Group Stage', ar: 'دور المجموعات' },
  { key: 'round_of_16', en: 'Round of 16', ar: 'دور الـ 16' },
  { key: 'quarter_final', en: 'Quarter Finals', ar: 'ربع النهائي' },
  { key: 'semi_final', en: 'Semi Finals', ar: 'نصف النهائي' },
  { key: 'final', en: 'Finals', ar: 'النهائي' },
];

export const stageLabels: Record<string, { en: string; ar: string }> = {
  group: { en: 'Group Stage', ar: 'دور المجموعات' },
  round_of_16: { en: 'Round of 16', ar: 'دور الـ 16' },
  quarter_final: { en: 'Quarter Final', ar: 'ربع النهائي' },
  semi_final: { en: 'Semi Final', ar: 'نصف النهائي' },
  third_place: { en: 'Third Place', ar: 'المركز الثالث' },
  final: { en: 'Final', ar: 'النهائي' },
};
