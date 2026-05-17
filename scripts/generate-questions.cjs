const fs = require('fs');

const categories = {
  wc2026: { name: 'wc2026-teams', focus: 'World Cup 2026 teams, groups, format' },
  wch: { name: 'wc-history', focus: 'World Cup history, past tournaments' },
  flag: { name: 'guess-flag', focus: 'Country flags, colors, symbols' },
  player: { name: 'guess-player', focus: 'Famous players, nationalities, achievements' },
  stadium: { name: 'stadiums', focus: 'Stadium locations, capacities, facts' },
  arab: { name: 'arab-teams', focus: 'Arab football teams and achievements' },
  africa: { name: 'african-teams', focus: 'African football nations and history' },
  euro: { name: 'european-teams', focus: 'European football history and records' },
  sa: { name: 'south-american-teams', focus: 'South American football' },
  asia: { name: 'asian-teams', focus: 'Asian football nations' },
  rules: { name: 'football-rules', focus: 'Laws of the game' },
  goals: { name: 'famous-goals', focus: 'Iconic goals in football history' },
  finals: { name: 'finals-history', focus: 'World Cup finals history' },
  pen: { name: 'penalty-drama', focus: 'Penalty shootouts and drama' },
  caps: { name: 'captains-legends', focus: 'Legendary captains and record holders' },
  lebanon: { name: 'lebanese-fan-culture', focus: 'Lebanese football culture' }
};

// Helper: pick N random items from array without repeats
function pick(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// Helper: pick random wrong answers ensuring no duplicates
function makeOptions(correct, pool, count = 3) {
  const wrong = pool.filter(x => x !== correct);
  const picked = pick(wrong, count);
  const options = [correct, ...picked];
  // Shuffle so correct isn't always first
  return options.sort(() => Math.random() - 0.5);
}

const teams48 = [
  { en: 'Mexico', ar: 'المكسيك', group: 'A', code: 'MEX' },
  { en: 'South Africa', ar: 'جنوب أفريقيا', group: 'A', code: 'RSA' },
  { en: 'Korea Republic', ar: 'كوريا الجنوبية', group: 'A', code: 'KOR' },
  { en: 'Czechia', ar: 'التشيك', group: 'A', code: 'CZE' },
  { en: 'Canada', ar: 'كندا', group: 'B', code: 'CAN' },
  { en: 'Bosnia and Herzegovina', ar: 'البوسنة والهرسك', group: 'B', code: 'BIH' },
  { en: 'Qatar', ar: 'قطر', group: 'B', code: 'QAT' },
  { en: 'Switzerland', ar: 'سويسرا', group: 'B', code: 'SUI' },
  { en: 'Brazil', ar: 'البرازيل', group: 'C', code: 'BRA' },
  { en: 'Morocco', ar: 'المغرب', group: 'C', code: 'MAR' },
  { en: 'Haiti', ar: 'هايتي', group: 'C', code: 'HAI' },
  { en: 'Scotland', ar: 'اسكتلندا', group: 'C', code: 'SCO' },
  { en: 'USA', ar: 'الولايات المتحدة', group: 'D', code: 'USA' },
  { en: 'Paraguay', ar: 'باراغواي', group: 'D', code: 'PAR' },
  { en: 'Australia', ar: 'أستراليا', group: 'D', code: 'AUS' },
  { en: 'Türkiye', ar: 'تركيا', group: 'D', code: 'TUR' },
  { en: 'Germany', ar: 'ألمانيا', group: 'E', code: 'GER' },
  { en: 'Curaçao', ar: 'كوراساو', group: 'E', code: 'CUW' },
  { en: "Côte d'Ivoire", ar: 'ساحل العاج', group: 'E', code: 'CIV' },
  { en: 'Ecuador', ar: 'الإكوادور', group: 'E', code: 'ECU' },
  { en: 'Netherlands', ar: 'هولندا', group: 'F', code: 'NED' },
  { en: 'Japan', ar: 'اليابان', group: 'F', code: 'JPN' },
  { en: 'Tunisia', ar: 'تونس', group: 'F', code: 'TUN' },
  { en: 'Sweden', ar: 'السويد', group: 'F', code: 'SWE' },
  { en: 'Belgium', ar: 'بلجيكا', group: 'G', code: 'BEL' },
  { en: 'Egypt', ar: 'مصر', group: 'G', code: 'EGY' },
  { en: 'IR Iran', ar: 'إيران', group: 'G', code: 'IRN' },
  { en: 'New Zealand', ar: 'نيوزيلندا', group: 'G', code: 'NZL' },
  { en: 'Spain', ar: 'إسبانيا', group: 'H', code: 'ESP' },
  { en: 'Cabo Verde', ar: 'الرأس الأخضر', group: 'H', code: 'CPV' },
  { en: 'Saudi Arabia', ar: 'السعودية', group: 'H', code: 'KSA' },
  { en: 'Uruguay', ar: 'الأوروغواي', group: 'H', code: 'URU' },
  { en: 'France', ar: 'فرنسا', group: 'I', code: 'FRA' },
  { en: 'Senegal', ar: 'السنغال', group: 'I', code: 'SEN' },
  { en: 'Iraq', ar: 'العراق', group: 'I', code: 'IRQ' },
  { en: 'Norway', ar: 'النرويج', group: 'I', code: 'NOR' },
  { en: 'Argentina', ar: 'الأرجنتين', group: 'J', code: 'ARG' },
  { en: 'Algeria', ar: 'الجزائر', group: 'J', code: 'ALG' },
  { en: 'Austria', ar: 'النمسا', group: 'J', code: 'AUT' },
  { en: 'Jordan', ar: 'الأردن', group: 'J', code: 'JOR' },
  { en: 'Portugal', ar: 'البرتغال', group: 'K', code: 'POR' },
  { en: 'Colombia', ar: 'كولومبيا', group: 'K', code: 'COL' },
  { en: 'Uzbekistan', ar: 'أوزبكستان', group: 'K', code: 'UZB' },
  { en: 'Congo DR', ar: 'الكونغو الديمقراطية', group: 'K', code: 'COD' },
  { en: 'England', ar: 'إنجلترا', group: 'L', code: 'ENG' },
  { en: 'Croatia', ar: 'كرواتيا', group: 'L', code: 'CRO' },
  { en: 'Ghana', ar: 'غانا', group: 'L', code: 'GHA' },
  { en: 'Panama', ar: 'بنما', group: 'L', code: 'PAN' }
];

const teamNamesEn = teams48.map(t => t.en);
const teamNamesAr = teams48.map(t => t.ar);
const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// All questions stored as objects
const questions = [];
let usedKeys = new Set();

function addQ(cat, en, ar, ans, ansa, correct, diff, exp, expa) {
  // Check for duplicate using normalized key
  const key = en.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (usedKeys.has(key)) return false;
  usedKeys.add(key);
  questions.push({ cat, en, ar, ans: JSON.stringify(ans), ansa: JSON.stringify(ansa), correct, diff, exp, expa });
  return true;
}

function make4(correctEn, correctAr, poolEn, poolAr) {
  const wrongEn = poolEn.filter(x => x !== correctEn).sort(() => Math.random() - 0.5).slice(0, 3);
  const wrongAr = wrongEn.map(w => poolAr[poolEn.indexOf(w)] || w);
  const optsEn = [correctEn, ...wrongEn].sort(() => Math.random() - 0.5);
  const optsAr = optsEn.map(o => o === correctEn ? correctAr : (poolAr[poolEn.indexOf(o)] || o));
  const correctIdx = optsEn.indexOf(correctEn);
  return { ans: optsEn, ansa: optsAr, correctIdx };
}

// ========================================================================
// 1. WC2026 TEAMS (~80 questions)
// ========================================================================
const cat1 = 'wc2026';
let count = 0;

// Group composition questions
for (const g of groups) {
  const gTeams = teams48.filter(t => t.group === g);
  if (gTeams.length < 4) continue;
  const names = gTeams.map(t => t.en);
  const namesAr = gTeams.map(t => t.ar);
  addQ(cat1, `Which teams are in Group ${g} of the 2026 World Cup?`, `ما هي المنتخبات في المجموعة ${g} من كأس العالم 2026؟`,
    names, namesAr, 0, 'easy', `Group ${g}: ${names.join(', ')}`, `المجموعة ${g}: ${namesAr.join('، ')}`);
}
for (const g of groups) {
  const gTeams = teams48.filter(t => t.group === g);
  for (const t of gTeams) {
    const others = gTeams.filter(x => x.en !== t.en).map(x => x.en);
    const othersAr = gTeams.filter(x => x.en !== t.en).map(x => x.ar);
    const pool = make4(t.en, t.ar, teamNamesEn, teamNamesAr);
    if (addQ(cat1, `Which team is in Group ${g} alongside ${others.slice(0,2).join(' and ')}?`, `أي منتخب في المجموعة ${g} إلى جانب ${othersAr.slice(0,2).join(' و ')}؟`,
      pool.ans, pool.ansa, pool.correctIdx, 'medium', `${t.en} is in Group ${g}.`, `${t.ar} في المجموعة ${g}.`)) count++;
  }
}

// General WC2026 format questions
addQ(cat1, 'How many teams are in the 2026 World Cup?', 'كم عدد المنتخبات في كأس العالم 2026؟',
  ['48', '32', '64', '24'], ['48', '32', '64', '24'], 0, 'easy',
  '48 teams across 12 groups.', '48 منتخباً في 12 مجموعة.');
addQ(cat1, 'How many groups are in the 2026 World Cup?', 'كم عدد المجموعات في كأس العالم 2026؟',
  ['12', '8', '16', '6'], ['12', '8', '16', '6'], 0, 'easy',
  '12 groups of 4 teams each.', '12 مجموعة من 4 فرق.');
addQ(cat1, 'Which countries are hosting the 2026 World Cup?', 'ما هي الدول المستضيفة لكأس العالم 2026؟',
  ['USA, Canada, Mexico', 'USA only', 'Canada only', 'Mexico only'],
  ['الولايات المتحدة، كندا، المكسيك', 'الولايات المتحدة فقط', 'كندا فقط', 'المكسيك فقط'],
  0, 'easy', 'Tri-hosted by USA, Canada, and Mexico.', 'مشترك بين الولايات المتحدة وكندا والمكسيك.');
addQ(cat1, 'How many teams advance from each group?', 'كم فريقاً يتأهل من كل مجموعة؟',
  ['Top 2 (16 total)', 'Winner only (12 total)', 'Top 3 (36 total)', 'Top 1 (12 total)'],
  ['أول 2 (16 إجمالاً)', 'الفائز فقط (12 إجمالاً)', 'أول 3 (36 إجمالاً)', 'الأول (12 إجمالاً)'],
  0, 'medium', 'Top 2 from each of 12 groups advance to Round of 16.', 'أول 2 من كل مجموعة يتأهلون لدور الـ 16.');
addQ(cat1, 'What is the total number of matches in the 2026 World Cup?', 'ما هو العدد الإجمالي للمباريات في كأس العالم 2026؟',
  ['104', '64', '80', '48'], ['104', '64', '80', '48'], 0, 'hard',
  '48 teams means 104 matches total (up from 64).', '48 منتخباً يعني 104 مباريات إجمالاً.');
addQ(cat1, 'What is the first knockout round called?', 'ما اسم أول دور خروج المغلوب؟',
  ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Round of 32'],
  ['دور الـ 16', 'ربع النهائي', 'نصف النهائي', 'دور الـ 32'],
  0, 'easy', 'After group stage comes the Round of 16.', 'بعد دور المجموعات يأتي دور الـ 16.');
addQ(cat1, 'Which African teams qualified for the 2026 World Cup?', 'ما هي المنتخبات الأفريقية المتأهلة لكأس العالم 2026؟',
  ['South Africa, Morocco, Tunisia, Egypt, Senegal, Côte d\'Ivoire, Algeria, Ghana',
   'Nigeria, Cameroon, Ghana, Egypt, Morocco',
   'Morocco, Senegal, Algeria, Tunisia, Egypt',
   'South Africa, Egypt, Morocco, Algeria, Nigeria'],
  ['جنوب أفريقيا، المغرب، تونس، مصر، السنغال، ساحل العاج، الجزائر، غانا',
   'نيجيريا، الكاميرون، غانا، مصر، المغرب',
   'المغرب، السنغال، الجزائر، تونس، مصر',
   'جنوب أفريقيا، مصر، المغرب، الجزائر، نيجيريا'],
  0, 'hard', '8 African teams qualified for 2026.', '8 منتخبات أفريقية تأهلت.');
for (let i = 0; i < 10; i++) {
  const t = teams48[i % 48];
  const pool = make4(t.en, t.ar, teamNamesEn, teamNamesAr);
  addQ(cat1, `Which team is known by the FIFA code ${t.code}?`, `أي منتخب يُعرف بالرمز ${t.code}؟`,
    pool.ans, pool.ansa, pool.correctIdx, 'medium', `${t.en} = ${t.code}`, `${t.ar} = ${t.code}`);
}

// ========================================================================
// 2. WC HISTORY (~55 questions)
// ========================================================================
const cat2 = 'wch';
const worldCups = [
  { year: 1930, winner: 'Uruguay', winnerAr: 'الأوروغواي', runnerUp: 'Argentina', runnerUpAr: 'الأرجنتين', host: 'Uruguay', hostAr: 'الأوروغواي' },
  { year: 1934, winner: 'Italy', winnerAr: 'إيطاليا', runnerUp: 'Czechoslovakia', runnerUpAr: 'تشيكوسلوفاكيا', host: 'Italy', hostAr: 'إيطاليا' },
  { year: 1938, winner: 'Italy', winnerAr: 'إيطاليا', runnerUp: 'Hungary', runnerUpAr: 'المجر', host: 'France', hostAr: 'فرنسا' },
  { year: 1950, winner: 'Uruguay', winnerAr: 'الأوروغواي', runnerUp: 'Brazil', runnerUpAr: 'البرازيل', host: 'Brazil', hostAr: 'البرازيل' },
  { year: 1954, winner: 'West Germany', winnerAr: 'ألمانيا الغربية', runnerUp: 'Hungary', runnerUpAr: 'المجر', host: 'Switzerland', hostAr: 'سويسرا' },
  { year: 1958, winner: 'Brazil', winnerAr: 'البرازيل', runnerUp: 'Sweden', runnerUpAr: 'السويد', host: 'Sweden', hostAr: 'السويد' },
  { year: 1962, winner: 'Brazil', winnerAr: 'البرازيل', runnerUp: 'Czechoslovakia', runnerUpAr: 'تشيكوسلوفاكيا', host: 'Chile', hostAr: 'تشيلي' },
  { year: 1966, winner: 'England', winnerAr: 'إنجلترا', runnerUp: 'West Germany', runnerUpAr: 'ألمانيا الغربية', host: 'England', hostAr: 'إنجلترا' },
  { year: 1970, winner: 'Brazil', winnerAr: 'البرازيل', runnerUp: 'Italy', runnerUpAr: 'إيطاليا', host: 'Mexico', hostAr: 'المكسيك' },
  { year: 1974, winner: 'West Germany', winnerAr: 'ألمانيا الغربية', runnerUp: 'Netherlands', runnerUpAr: 'هولندا', host: 'West Germany', hostAr: 'ألمانيا الغربية' },
  { year: 1978, winner: 'Argentina', winnerAr: 'الأرجنتين', runnerUp: 'Netherlands', runnerUpAr: 'هولندا', host: 'Argentina', hostAr: 'الأرجنتين' },
  { year: 1982, winner: 'Italy', winnerAr: 'إيطاليا', runnerUp: 'West Germany', runnerUpAr: 'ألمانيا الغربية', host: 'Spain', hostAr: 'إسبانيا' },
  { year: 1986, winner: 'Argentina', winnerAr: 'الأرجنتين', runnerUp: 'West Germany', runnerUpAr: 'ألمانيا الغربية', host: 'Mexico', hostAr: 'المكسيك' },
  { year: 1990, winner: 'West Germany', winnerAr: 'ألمانيا الغربية', runnerUp: 'Argentina', runnerUpAr: 'الأرجنتين', host: 'Italy', hostAr: 'إيطاليا' },
  { year: 1994, winner: 'Brazil', winnerAr: 'البرازيل', runnerUp: 'Italy', runnerUpAr: 'إيطاليا', host: 'USA', hostAr: 'الولايات المتحدة' },
  { year: 1998, winner: 'France', winnerAr: 'فرنسا', runnerUp: 'Brazil', runnerUpAr: 'البرازيل', host: 'France', hostAr: 'فرنسا' },
  { year: 2002, winner: 'Brazil', winnerAr: 'البرازيل', runnerUp: 'Germany', runnerUpAr: 'ألمانيا', host: 'Korea/Japan', hostAr: 'كوريا/اليابان' },
  { year: 2006, winner: 'Italy', winnerAr: 'إيطاليا', runnerUp: 'France', runnerUpAr: 'فرنسا', host: 'Germany', hostAr: 'ألمانيا' },
  { year: 2010, winner: 'Spain', winnerAr: 'إسبانيا', runnerUp: 'Netherlands', runnerUpAr: 'هولندا', host: 'South Africa', hostAr: 'جنوب أفريقيا' },
  { year: 2014, winner: 'Germany', winnerAr: 'ألمانيا', runnerUp: 'Argentina', runnerUpAr: 'الأرجنتين', host: 'Brazil', hostAr: 'البرازيل' },
  { year: 2018, winner: 'France', winnerAr: 'فرنسا', runnerUp: 'Croatia', runnerUpAr: 'كرواتيا', host: 'Russia', hostAr: 'روسيا' },
  { year: 2022, winner: 'Argentina', winnerAr: 'الأرجنتين', runnerUp: 'France', runnerUpAr: 'فرنسا', host: 'Qatar', hostAr: 'قطر' }
];

// Winners questions
for (let i = 0; i < worldCups.length; i++) {
  const wc = worldCups[i];
  if (i < 11) {
    const pool = make4(wc.winner, wc.winnerAr,
      worldCups.map(x => x.winner).concat(worldCups.map(x => x.runnerUp)),
      worldCups.map(x => x.winnerAr).concat(worldCups.map(x => x.runnerUpAr)));
    addQ(cat2, `Who won the ${wc.year} World Cup?`, `من فاز بكأس العالم ${wc.year}؟`,
      pool.ans, pool.ansa, pool.correctIdx, 'easy',
      `${wc.winner} won in ${wc.year}.`, `${wc.winnerAr} فازت في ${wc.year}.`);
  } else {
    const pool = make4(wc.runnerUp, wc.runnerUpAr,
      worldCups.map(x => x.runnerUp).concat(worldCups.map(x => x.winner)),
      worldCups.map(x => x.runnerUpAr).concat(worldCups.map(x => x.winnerAr)));
    addQ(cat2, `Who was runner-up in the ${wc.year} World Cup?`, `من كان الوصيف في كأس العالم ${wc.year}؟`,
      pool.ans, pool.ansa, pool.correctIdx, 'medium',
      `${wc.runnerUp} were runners-up in ${wc.year}.`, `${wc.runnerUpAr} كانت وصيفة في ${wc.year}.`);
  }
}

// Host questions
for (let i = 0; i < 12; i++) {
  const wc = worldCups[i * 2 % 22];
  const pool = make4(wc.host, wc.hostAr,
    worldCups.map(x => x.host), worldCups.map(x => x.hostAr));
  addQ(cat2, `Which country hosted the ${wc.year} World Cup?`, `أي دولة استضافت كأس العالم ${wc.year}؟`,
    pool.ans, pool.ansa, pool.correctIdx, 'easy',
    `${wc.host} hosted in ${wc.year}.`, `${wc.hostAr} استضافت في ${wc.year}.`);
}

// Stats questions
addQ(cat2, 'Which country has the most World Cup titles?', 'أي دولة لديها أكبر عدد من ألقاب كأس العالم؟',
  ['Brazil (5)', 'Germany (4)', 'Italy (4)', 'Argentina (3)'],
  ['البرازيل (5)', 'ألمانيا (4)', 'إيطاليا (4)', 'الأرجنتين (3)'],
  0, 'easy', 'Brazil has 5 World Cup titles.', 'البرازيل لديها 5 ألقاب.');
addQ(cat2, 'Which country has the most World Cup appearances?', 'أي دولة لديها أكبر عدد من المشاركات في كأس العالم؟',
  ['Brazil (all 22)', 'Germany (20)', 'Italy (18)', 'Argentina (18)'],
  ['البرازيل (جميع الـ 22)', 'ألمانيا (20)', 'إيطاليا (18)', 'الأرجنتين (18)'],
  0, 'medium', 'Brazil is the only country to play in every World Cup.', 'البرازيل هي الدولة الوحيدة التي شاركت في كل النسخ.');
addQ(cat2, 'Which country has the best World Cup win percentage?', 'أي دولة لديها أعلى نسبة فوز في كأس العالم؟',
  ['Argentina', 'Brazil', 'Germany', 'Italy'],
  ['الأرجنتين', 'البرازيل', 'ألمانيا', 'إيطاليا'],
  0, 'hard', 'Argentina has the best win percentage (min 50 matches).', 'الأرجنتين لديها أعلى نسبة فوز.');
addQ(cat2, 'What was the highest-scoring World Cup final?', 'ما هو نهائي كأس العالم الأكثر تهديفاً؟',
  ['Brazil 5-2 Sweden (1958)', 'Germany 4-2 Argentina (2014)', 'Brazil 4-1 Italy (1970)', 'France 3-0 Brazil (1998)'],
  ['البرازيل 5-2 السويد (1958)', 'ألمانيا 4-2 الأرجنتين (2014)', 'البرازيل 4-1 إيطاليا (1970)', 'فرنسا 3-0 البرازيل (1998)'],
  0, 'hard', '1958 final had 7 goals total.', 'نهائي 1958 شهد 7 أهداف.');
addQ(cat2, 'Which country won the World Cup on home soil?', 'أي دولة فازت بكأس العالم على أرضها؟',
  ['Uruguay (1930), Italy (1934), England (1966), Germany (1974), Argentina (1978), France (1998)',
   'Brazil (1950), Spain (1982)',
   'Only Uruguay and Italy',
   'Germany and Brazil'],
  ['الأوروغواي (1930)، إيطاليا (1934)، إنجلترا (1966)، ألمانيا (1974)، الأرجنتين (1978)، فرنسا (1998)',
   'البرازيل (1950)، إسبانيا (1982)',
   'فقط الأوروغواي وإيطاليا',
   'ألمانيا والبرازيل'],
  0, 'hard', '6 countries have won at home.', '6 دول فازت على أرضها.');

// ========================================================================
// 3. GUESS THE FLAG (~40 questions)
// ========================================================================
const cat3 = 'flag';
const flags = [
  { en: 'Mexico', ar: 'المكسيك', desc: 'Green, white, red with eagle in center', descAr: 'أخضر، أبيض، أحمر مع نسر في الوسط' },
  { en: 'Brazil', ar: 'البرازيل', desc: 'Green, yellow, blue circle with stars', descAr: 'أخضر، أصفر، دائرة زرقاء مع نجوم' },
  { en: 'France', ar: 'فرنسا', desc: 'Blue, white, red vertical stripes', descAr: 'أزرق، أبيض، أحمر خطوط عمودية' },
  { en: 'Germany', ar: 'ألمانيا', desc: 'Black, red, gold horizontal stripes', descAr: 'أسود، أحمر، ذهبي خطوط أفقية' },
  { en: 'Italy', ar: 'إيطاليا', desc: 'Green, white, red vertical stripes', descAr: 'أخضر، أبيض، أحمر خطوط عمودية' },
  { en: 'Spain', ar: 'إسبانيا', desc: 'Red, yellow, red horizontal with coat of arms', descAr: 'أحمر، أصفر، أحمر أفقي مع شعار' },
  { en: 'England', ar: 'إنجلترا', desc: 'White with red St. George cross', descAr: 'أبيض مع صليب القديس جورج الأحمر' },
  { en: 'Scotland', ar: 'اسكتلندا', desc: 'Blue with white diagonal cross', descAr: 'أزرق مع صليب أبيض قطري' },
  { en: 'Japan', ar: 'اليابان', desc: 'White with red circle', descAr: 'أبيض مع دائرة حمراء' },
  { en: 'Argentina', ar: 'الأرجنتين', desc: 'Light blue and white stripes with sun', descAr: 'خطوط زرقاء فاتحة وبيضاء مع شمس' },
  { en: 'Netherlands', ar: 'هولندا', desc: 'Red, white, blue horizontal stripes', descAr: 'أحمر، أبيض، أزرق خطوط أفقية' },
  { en: 'Switzerland', ar: 'سويسرا', desc: 'Red with white cross', descAr: 'أحمر مع صليب أبيض' },
  { en: 'Sweden', ar: 'السويد', desc: 'Blue with yellow cross', descAr: 'أزرق مع صليب أصفر' },
  { en: 'Croatia', ar: 'كرواتيا', desc: 'Red, white, blue with checkerboard', descAr: 'أحمر، أبيض، أزرق مع رقعة شطرنج' },
  { en: 'Portugal', ar: 'البرتغال', desc: 'Green and red with shield', descAr: 'أخضر وأحمر مع درع' },
  { en: 'Belgium', ar: 'بلجيكا', desc: 'Black, yellow, red vertical stripes', descAr: 'أسود، أصفر، أحمر خطوط عمودية' },
  { en: 'Morocco', ar: 'المغرب', desc: 'Red with green pentagram', descAr: 'أحمر مع نجمة خضراء' },
  { en: 'Algeria', ar: 'الجزائر', desc: 'Green, white, red crescent and star', descAr: 'أخضر، أبيض، هلال ونجمة أحمران' },
  { en: 'Tunisia', ar: 'تونس', desc: 'Red with white circle and crescent', descAr: 'أحمر مع دائرة بيضاء وهلال' },
  { en: 'Saudi Arabia', ar: 'السعودية', desc: 'Green with white inscription/sword', descAr: 'أخضر مع كتابة بيضاء وسيف' },
  { en: 'Egypt', ar: 'مصر', desc: 'Red, white, black with golden eagle', descAr: 'أحمر، أبيض، أسود مع نسر ذهبي' },
  { en: 'USA', ar: 'الولايات المتحدة', desc: 'Red and white stripes with blue stars', descAr: 'خطوط حمراء وبيضاء مع نجوم زرقاء' },
  { en: 'Canada', ar: 'كندا', desc: 'Red with white square and maple leaf', descAr: 'أحمر مع مربع أبيض وورقة قيقب' },
  { en: 'Colombia', ar: 'كولومبيا', desc: 'Yellow, blue, red horizontal stripes', descAr: 'أصفر، أزرق، أحمر خطوط أفقية' },
  { en: 'Uruguay', ar: 'الأوروغواي', desc: 'White and blue stripes with sun', descAr: 'خطوط بيضاء وزرقاء مع شمس' },
  { en: 'Qatar', ar: 'قطر', desc: 'Maroon and white with serrated edge', descAr: 'عنابي وأبيض بحافة مسننة' },
  { en: 'Senegal', ar: 'السنغال', desc: 'Green, yellow, red vertical with green star', descAr: 'أخضر، أصفر، أحمر عمودي مع نجمة خضراء' },
  { en: 'South Africa', ar: 'جنوب أفريقيا', desc: 'Black, green, yellow, red, blue, white', descAr: 'أسود، أخضر، أصفر، أحمر، أزرق، أبيض' },
  { en: 'Nigeria', ar: 'نيجيريا', desc: 'Green and white vertical stripes', descAr: 'أخضر وأبيض خطوط عمودية' },
  { en: 'Cameroon', ar: 'الكاميرون', desc: 'Green, red, yellow vertical with yellow star', descAr: 'أخضر، أحمر، أصفر عمودي مع نجمة صفراء' },
];

for (let i = 0; i < flags.length; i++) {
  const f = flags[i];
  const pool = make4(f.en, f.ar, flags.map(x => x.en), flags.map(x => x.ar));
  const diff = i < 10 ? 'easy' : i < 20 ? 'medium' : 'hard';
  addQ(cat3, `Which country\'s flag is: "${f.desc}"?`, `علم أي دولة يوصف بأنه: "${f.descAr}"؟`,
    pool.ans, pool.ansa, pool.correctIdx, diff,
    `${f.en}'s flag: ${f.desc}`, `علم ${f.ar}: ${f.descAr}`);
}

// ========================================================================
// 4. GUESS THE PLAYER (~45 questions)
// ========================================================================
const cat4 = 'player';
const players = [
  { en: 'Lionel Messi', ar: 'ليونيل ميسي', country: 'Argentina', countryAr: 'الأرجentina', known: 'World Cup winner 2022, 8 Ballon d\'Or', knownAr: 'فائز بكأس العالم 2022، 8 كرات ذهبية' },
  { en: 'Cristiano Ronaldo', ar: 'كريستيانو رونالدو', country: 'Portugal', countryAr: 'البرتغال', known: '5 Ballon d\'Or, most goals ever', knownAr: '5 كرات ذهبية، أكثر من سجل أهدافاً' },
  { en: 'Neymar Jr', ar: 'نيمار', country: 'Brazil', countryAr: 'البرازيل', known: 'Samba style, top scorer for Brazil', knownAr: 'أسلوب السامبا، هداف البرازيل' },
  { en: 'Kylian Mbappé', ar: 'كيليان مبابي', country: 'France', countryAr: 'فرنسا', known: 'World Cup winner 2018, fastest in Bundesliga', knownAr: 'فائز بكأس العالم 2018' },
  { en: 'Mohamed Salah', ar: 'محمد صلاح', country: 'Egypt', countryAr: 'مصر', known: 'Egyptian King, Premier League top scorer', knownAr: 'الملك المصري، هداف الدوري الإنجليزي' },
  { en: 'Karim Benzema', ar: 'كريم بنزيما', country: 'France', countryAr: 'فرنسا', known: 'Ballon d\'Or 2022, UCL top scorer', knownAr: 'الكرة الذهبية 2022' },
  { en: 'Erling Haaland', ar: 'إيرلينغ هالاند', country: 'Norway', countryAr: 'النرويج', known: 'Goal machine, Premier League record', knownAr: 'آلة أهداف، رقم قياسي في الدوري الإنجليزي' },
  { en: 'Robert Lewandowski', ar: 'روبرت ليفاندوفسكي', country: 'Poland', countryAr: 'بولندا', known: 'Top striker, 2x FIFA Best', knownAr: 'مهاجم من الطراز الأول' },
  { en: 'Kevin De Bruyne', ar: 'كيفين دي بروين', country: 'Belgium', countryAr: 'بلجيكا', known: 'Midfield maestro, best playmaker', knownAr: 'مايسترو وسط الملعب' },
  { en: 'Luka Modrić', ar: 'لوكا مودريتش', country: 'Croatia', countryAr: 'كرواتيا', known: 'Ballon d\'Or 2018, World Cup runner-up', knownAr: 'الكرة الذهبية 2018' },
  { en: 'Sadio Mané', ar: 'ساديو ماني', country: 'Senegal', countryAr: 'السنغال', known: 'African champion, UCL winner', knownAr: 'بطل أفريقيا، فائز بدوري الأبطال' },
  { en: 'Achraf Hakimi', ar: 'أشرف حكيمي', country: 'Morocco', countryAr: 'المغرب', known: 'Best full-back, World Cup semi-finalist', knownAr: 'أفضل ظهير، نصف نهائي كأس العالم' },
  { en: 'Riyad Mahrez', ar: 'رياض محرز', country: 'Algeria', countryAr: 'الجزائر', known: 'Premier League winner with Leicester', knownAr: 'فائز بالدوري الإنجليزي مع ليستر' },
  { en: 'Hakim Ziyech', ar: 'حكيم زياش', country: 'Morocco', countryAr: 'المغرب', known: 'Magic left foot, UCL winner', knownAr: 'القدم اليسرى السحرية' },
  { en: 'Victor Osimhen', ar: 'فيكتور أوسيمين', country: 'Nigeria', countryAr: 'نيجيريا', known: 'African Best Player, Serie A top scorer', knownAr: 'أفضل لاعب أفريقي' },
  { en: 'Pelé', ar: 'بيليه', country: 'Brazil', countryAr: 'البرازيل', known: '3x World Cup winner, The King', knownAr: 'فائز بكأس العالم 3 مرات، الملك' },
  { en: 'Diego Maradona', ar: 'دييغو مارادونا', country: 'Argentina', countryAr: 'الأرجنتين', known: 'Hand of God, 1986 World Cup winner', knownAr: 'يد الله، فائز بكأس العالم 1986' },
  { en: 'Zinedine Zidane', ar: 'زين الدين زيدان', country: 'France', countryAr: 'فرنسا', known: 'World Cup winner 1998, UCL winner as coach', knownAr: 'فائز بكأس العالم 1998' },
  { en: 'Ronaldinho', ar: 'رونالدينيو', country: 'Brazil', countryAr: 'البرازيل', known: 'Samba magic, Ballon d\'Or 2005', knownAr: 'سحر السامبا، الكرة الذهبية 2005' },
  { en: 'Andrés Iniesta', ar: 'أندريس إنييستا', country: 'Spain', countryAr: 'إسبانيا', known: 'World Cup winner 2010, Euro winner', knownAr: 'فائز بكأس العالم 2010' },
  { en: 'Xavi Hernández', ar: 'تشافي هيرنانديز', country: 'Spain', countryAr: 'إسبانيا', known: 'Midfield legend, World Cup winner', knownAr: 'أسطورة وسط الملعب' },
  { en: 'Manuel Neuer', ar: 'مانويل نوير', country: 'Germany', countryAr: 'ألمانيا', known: 'Best goalkeeper, World Cup winner 2014', knownAr: 'أفضل حارس مرمى' },
  { en: 'Sergio Ramos', ar: 'سيرخيو راموس', country: 'Spain', countryAr: 'إسبانيا', known: 'Legendary defender, World Cup winner', knownAr: 'مدافع أسطوري' },
  { en: 'Gianluigi Buffon', ar: 'جيانلويجي بوفون', country: 'Italy', countryAr: 'إيطاليا', known: 'World Cup winner 2006, most caps for Italy', knownAr: 'فائز بكأس العالم 2006' },
  { en: 'Zlatan Ibrahimović', ar: 'زلاتان إبراهيموفيتش', country: 'Sweden', countryAr: 'السويد', known: 'Acrobatic goals, legendary striker', knownAr: 'أهداف بهلوانية، مهاجم أسطوري' },
];

// By country
for (let i = 0; i < players.length; i++) {
  const p = players[i];
  const pool = make4(p.en, p.ar, players.map(x => x.en), players.map(x => x.ar));
  const diff = i < 8 ? 'easy' : i < 16 ? 'medium' : 'hard';
  addQ(cat4, `Which player is from ${p.country}?`, `أي لاعب من ${p.countryAr}؟`,
    pool.ans, pool.ansa, pool.correctIdx, diff,
    `${p.en} plays for ${p.country}.`, `${p.ar} يلعب لـ ${p.countryAr}.`);
}

// By known for
for (let i = 0; i < 20; i++) {
  const p = players[i % players.length];
  const pool = make4(p.en, p.ar, players.map(x => x.en), players.map(x => x.ar));
  addQ(cat4, `Which player is known as "${p.known}"?`, `أي لاعب يُعرف بـ "${p.knownAr}"؟`,
    pool.ans, pool.ansa, pool.correctIdx, 'medium',
    `${p.en}: ${p.known}`, `${p.ar}: ${p.knownAr}`);
}

// ========================================================================
// 5. STADIUMS (~30 questions)
// ========================================================================
const cat5 = 'stadium';
const stadiums = [
  { en: 'Wembley Stadium', ar: 'ملعب ويمبلي', city: 'London', cityAr: 'لندن', country: 'England', countryAr: 'إنجلترا', cap: '90,000', note: 'Home of English football', noteAr: 'بيت كرة القدم الإنجليزية' },
  { en: 'Camp Nou', ar: 'كامب نو', city: 'Barcelona', cityAr: 'برشلونة', country: 'Spain', countryAr: 'إسبانيا', cap: '99,354', note: 'Largest stadium in Europe', noteAr: 'أكبر ملعب في أوروبا' },
  { en: 'Maracanã', ar: 'ملعب الماراكانا', city: 'Rio de Janeiro', cityAr: 'ريو دي جانيرو', country: 'Brazil', countryAr: 'البرازيل', cap: '78,838', note: 'Iconic World Cup stadium', noteAr: 'ملعب كأس عالم أيقوني' },
  { en: 'Old Trafford', ar: 'أولد ترافورد', city: 'Manchester', cityAr: 'مانشستر', country: 'England', countryAr: 'إنجلترا', cap: '74,310', note: 'The Theatre of Dreams', noteAr: 'مسرح الأحلام' },
  { en: 'San Siro', ar: 'سان سيرو', city: 'Milan', cityAr: 'ميلان', country: 'Italy', countryAr: 'إيطاليا', cap: '80,018', note: 'Shared by AC Milan and Inter', noteAr: 'يتقاسمه ميلان وإنتر' },
  { en: 'Allianz Arena', ar: 'أليانز أرينا', city: 'Munich', cityAr: 'ميونخ', country: 'Germany', countryAr: 'ألمانيا', cap: '75,000', note: 'Changes color', noteAr: 'يغير لونه' },
  { en: 'Santiago Bernabéu', ar: 'سانتياغو برنابيو', city: 'Madrid', cityAr: 'مدريد', country: 'Spain', countryAr: 'إسبانيا', cap: '81,044', note: 'Home of Real Madrid', noteAr: 'ملعب ريال مدريد' },
  { en: 'Parc des Princes', ar: 'حديقة الأمراء', city: 'Paris', cityAr: 'باريس', country: 'France', countryAr: 'فرنسا', cap: '48,583', note: 'Home of PSG', noteAr: 'ملعب باريس سان جيرمان' },
  { en: 'Stade de France', ar: 'ملعب فرنسا', city: 'Saint-Denis', cityAr: 'سان دوني', country: 'France', countryAr: 'فرنسا', cap: '80,000', note: 'Built for 1998 World Cup', noteAr: 'بني لكأس العالم 1998' },
  { en: 'Lusail Stadium', ar: 'ملعب لوسيل', city: 'Lusail', cityAr: 'لوسيل', country: 'Qatar', countryAr: 'قطر', cap: '88,966', note: 'Hosted 2022 World Cup final', noteAr: 'استضاف نهائي كأس العالم 2022' },
  { en: 'Signal Iduna Park', ar: 'سيغنال إيدونا بارك', city: 'Dortmund', cityAr: 'دورتموند', country: 'Germany', countryAr: 'ألمانيا', cap: '81,365', note: 'Famous Yellow Wall', noteAr: 'الجدار الأصفر الشهير' },
  { en: 'Anfield', ar: 'أنفيلد', city: 'Liverpool', cityAr: 'ليفربول', country: 'England', countryAr: 'إنجلترا', cap: '61,276', note: 'Home of Liverpool FC', noteAr: 'ملعب ليفربول' },
  { en: 'Estádio da Luz', ar: 'ملعب النور', city: 'Lisbon', cityAr: 'لشبونة', country: 'Portugal', countryAr: 'البرتغال', cap: '64,642', note: 'Home of Benfica', noteAr: 'ملعب بنفيكا' },
  { en: 'Amsterdam Arena', ar: 'أمستردام أرينا', city: 'Amsterdam', cityAr: 'أمستردام', country: 'Netherlands', countryAr: 'هولندا', cap: '55,500', note: 'Home of Ajax', noteAr: 'ملعب أياكس' },
  { en: 'Olimpiyskiy Stadium', ar: 'الملعب الأولمبي', city: 'Kyiv', cityAr: 'كييف', country: 'Ukraine', countryAr: 'أوكرانيا', cap: '70,050', note: 'Euro 2012 final', noteAr: 'نهائي يورو 2012' },
];

for (let i = 0; i < stadiums.length; i++) {
  const s = stadiums[i];
  const pool = make4(s.en, s.ar, stadiums.map(x => x.en), stadiums.map(x => x.ar));
  const diff = i < 5 ? 'easy' : i < 10 ? 'medium' : 'hard';
  addQ(cat5, `Which stadium is in ${s.city}?`, `أي ملعب يقع في ${s.cityAr}؟`,
    pool.ans, pool.ansa, pool.correctIdx, diff,
    `${s.en} is in ${s.city}, ${s.country}.`, `${s.ar} يقع في ${s.cityAr}، ${s.countryAr}.`);
}
for (let i = 0; i < 10; i++) {
  const s = stadiums[i % stadiums.length];
  const pool = make4(s.en, s.ar, stadiums.map(x => x.en), stadiums.map(x => x.ar));
  addQ(cat5, `Which stadium has capacity of ${s.cap}?`, `أي ملعب يتسع لـ ${s.cap}؟`,
    pool.ans, pool.ansa, pool.correctIdx, 'hard',
    `${s.en} capacity: ${s.cap}`, `سعة ${s.ar}: ${s.cap}`);
}

// ========================================================================
// 6-16. REMAINING CATEGORIES (~200 questions total across all)
// ========================================================================

// Arab teams (25)
const arabQs = [
  ['Which Arab team reached the World Cup semi-finals?', 'أي منتخب عربي وصل إلى نصف نهائي كأس العالم؟', 'Morocco (2022)', 'المغرب (2022)', 'Saudi Arabia', 'السعودية', 'Egypt', 'مصر', 'Tunisia', 'تونس', 0, 'easy'],
  ['How many Arab teams played in the 2022 World Cup?', 'كم عدد المنتخبات العربية في كأس العالم 2022؟', '4 (Qatar, Saudi Arabia, Tunisia, Morocco)', '4 (قطر، السعودية، تونس، المغرب)', '3', '3', '5', '5', '2', '2', 0, 'medium'],
  ['Which Arab country has the best World Cup performance?', 'أي دولة عربية لديها أفضل أداء في كأس العالم؟', 'Morocco (Semi-finals 2022)', 'المغرب (نصف النهائي 2022)', 'Saudi Arabia (R16 1994)', 'السعودية (دور 16 1994)', 'Tunisia (Groups)', 'تونس (مجموعات)', 'Algeria (R16 2014)', 'الجزائر (دور 16 2014)', 0, 'medium'],
  ['Which Arab country won the AFC Asian Cup in 2019?', 'أي دولة عربية فازت بكأس آسيا 2019؟', 'Qatar', 'قطر', 'Saudi Arabia', 'السعودية', 'Iraq', 'العراق', 'UAE', 'الإمارات', 0, 'easy'],
  ['How many World Cups has Saudi Arabia qualified for?', 'كم عدد كؤوس العالم التي تأهلت لها السعودية？', '7 (1994-2026)', '7 (1994-2026)', '5', '5', '6', '6', '4', '4', 0, 'medium'],
  ['Who is Saudi Arabia all-time top scorer?', 'من هو الهداف التاريخي للسعودية؟', 'Majed Abdullah', 'ماجد عبد الله', 'Sami Al-Jaber', 'سامي الجابر', 'Yasser Al-Qahtani', 'ياسر القحطاني', 'Mohammad Al-Sahlawi', 'محمد السهلاوي', 0, 'hard'],
  ['Which Arab country hosted the 2022 World Cup?', 'أي دولة عربية استضافت كأس العالم 2022؟', 'Qatar', 'قطر', 'Saudi Arabia', 'السعودية', 'UAE', 'الإمارات', 'Morocco', 'المغرب', 0, 'easy'],
  ['Which Arab team has won the most AFC Asian Cup titles?', 'أي منتخب عربي فاز بأكبر عدد من ألقاب كأس آسيا؟', 'Saudi Arabia (4)', 'السعودية (4)', 'Qatar (2)', 'قطر (2)', 'Iraq (1)', 'العراق (1)', 'Kuwait (1)', 'الكويت (1)', 0, 'medium'],
  ['How many times has Iraq won the AFC Asian Cup?', 'كم مرة فاز العراق بكأس آسيا؟', '1 (2007)', '1 (2007)', '2', '2', '0', '0', '3', '3', 0, 'easy'],
  ['Which Arab team reached the 2018 World Cup?', 'أي منتخب عربي تأهل لكأس العالم 2018؟', 'Saudi Arabia, Egypt, Tunisia, Morocco', 'السعودية، مصر، تونس، المغرب', 'Saudi Arabia only', 'السعودية فقط', 'Egypt and Tunisia', 'مصر وتونس', 'Morocco and Algeria', 'المغرب والجزائر', 0, 'easy'],
];
for (const q of arabQs) {
  addQ('arab', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11]);
}

// Lebanese culture (20)
const lebQs = [
  ['Which Lebanese club wears green?', 'أي نادٍ لبناني يرتدي الأخضر؟', 'Al-Ahed', 'العهد', 'Nejmeh', 'النجمة', 'Al-Ansar', 'الأنصار', 'Racing Beirut', 'الراسينغ', 0, 'medium'],
  ['Which is the oldest Lebanese football club?', 'ما هو أقدم نادي كرة قدم لبناني؟', 'Racing Beirut (founded 1927)', 'الراسينغ (تأسس 1927)', 'Nejmeh (1945)', 'النجمة (1945)', 'Al-Ansar (1951)', 'الأنصار (1951)', 'Al-Ahed (1966)', 'العهد (1966)', 0, 'hard'],
  ['Which Lebanese club has the most league titles?', 'أي نادٍ لبناني لديه أكبر عدد من ألقاب الدوري؟', 'Al-Ansar (14)', 'الأنصار (14)', 'Nejmeh (9)', 'النجمة (9)', 'Al-Ahed (9)', 'العهد (9)', 'Racing Beirut (4)', 'الراسينغ (4)', 0, 'medium'],
  ['Which Lebanese club wears yellow?', 'أي نادٍ لبناني يرتدي الأصفر؟', 'Nejmeh SC', 'النجمة', 'Al-Ansar', 'الأنصار', 'Al-Ahed', 'العهد', 'Salam Zgharta', 'سلام زغرتا', 0, 'easy'],
  ['Where is Camille Chamoun Sports City Stadium?', 'أين يقع ملعب كميل شمعون الرياضي؟', 'Beirut', 'بيروت', 'Tripoli', 'طرابلس', 'Sidon', 'صيدا', 'Zahle', 'زحلة', 0, 'easy'],
  ['Which Lebanese player has played for a European top club?', 'أي لاعب لبناني لعب لنادٍ أوروبي كبير؟', 'No Lebanese player has reached top European clubs', 'لم يصل أي لاعب لبناني للأندية الأوروبية الكبرى', 'Roda Antar in Germany', 'رضا عنتر في ألمانيا', 'Youssef Mohamad in Germany', 'يوسف محمد في ألمانيا', 'Hassan Maatouk in Japan', 'حسن معتوق في اليابان', 0, 'hard'],
  ['What is the most popular football venue in Beirut?', 'ما هو أشهر ملعب كرة قدم في بيروت؟', 'Camille Chamoun Sports City Stadium', 'ملعب مدينة كميل شمعون الرياضية', 'Beirut Municipal Stadium', 'ملعب بيروت البلدي', 'Al Ahed Stadium', 'ملعب العهد', 'Nejmeh Stadium', 'ملعب النجمة', 0, 'easy'],
  ['How many Lebanese Premier League teams are there?', 'كم عدد فرق الدوري اللبناني؟', '12 teams', '12 فريقاً', '10 teams', '10 فرق', '14 teams', '14 فريقاً', '8 teams', '8 فرق', 0, 'medium'],
  ['In which year was the Lebanese Football Association founded?', 'في أي سنة تأسس الاتحاد اللبناني لكرة القدم؟', '1933', '1933', '1943', '1943', '1920', '1920', '1950', '1950', 0, 'hard'],
  ['Which Lebanese player holds the record for most national team caps?', 'أي لاعب لبناني يحمل الرقم القياسي لعدد المباريات الدولية؟', 'Hassan Maatouk', 'حسن معتوق', 'Roda Antar', 'رضا عنتر', 'Youssef Mohamad', 'يوسف محمد', 'Abbas Ahmed Atwi', 'عباس أحمد عطوي', 0, 'medium'],
  ['Lebanon\'s football federation belongs to which confederation?', 'الاتحاد اللبناني لكرة القدم يتبع أي اتحاد قاري؟', 'AFC (Asia)', 'الاتحاد الآسيوي', 'CAF (Africa)', 'الاتحاد الأفريقي', 'UEFA (Europe)', 'الاتحاد الأوروبي', 'WAFF (West Asia)', 'اتحاد غرب آسيا', 0, 'easy'],
  ['Which player is known as the "Lebanese Maradona"?', 'أي لاعب يُعرف بـ "مارادونا لبنان"؟', 'Jamal Khatib', 'جمال الخطيب', 'Hassan Maatouk', 'حسن معتوق', 'Roda Antar', 'رضا عنتر', 'Fadi Alloush', 'فادي علوش', 0, 'hard'],
  ['Which year did Lebanon first qualify for the AFC Asian Cup?', 'في أي سنة تأهل لبنان لأول مرة لكأس آسيا؟', '2000 (as hosts)', '2000 (كمستضيف)', '2004', '2004', '2010', '2010', '2015', '2015', 0, 'medium'],
  ['What color is the jersey of Al-Ansar SC?', 'ما هو لون قميص نادي الأنصار؟', 'Orange and black', 'برتقالي وأسود', 'Yellow', 'أصفر', 'Green', 'أخضر', 'Red', 'أحمر', 0, 'medium'],
  ['Which Lebanese team has won the most recent league title?', 'أي فريق لبناني فاز بأحدث لقب دوري؟', 'Al-Ahed', 'العهد', 'Nejmeh', 'النجمة', 'Al-Ansar', 'الأنصار', 'Salam Zgharta', 'سلام زغرتا', 0, 'medium'],
];
for (const q of lebQs) {
  addQ('lebanon', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11]);
}

// African teams (20)
const africaQs = [
  ['Which African team has the most World Cup appearances?', 'أي منتخب أفريقي لديه أكبر عدد من المشاركات في كأس العالم؟', 'Cameroon (9)', 'الكاميرون (9)', 'Nigeria (6)', 'نيجيريا (6)', 'Senegal (5)', 'السنغال (5)', 'Ghana (4)', 'غانا (4)', 0, 'medium'],
  ['Which African team was first to reach QF?', 'أي منتخب أفريقي كان أول من وصل لربع النهائي؟', 'Cameroon (1990)', 'الكاميرون (1990)', 'Senegal (2002)', 'السنغال (2002)', 'Nigeria (1994)', 'نيجيريا (1994)', 'Ghana (2010)', 'غانا (2010)', 0, 'medium'],
  ['Who is Africa\'s all-time top World Cup scorer?', 'من هو الهداف الأفريقي في تاريخ كأس العالم؟', 'Roger Milla (5 goals)', 'روجر ميلا (5 أهداف)', 'Asamoah Gyan (6 goals)', 'أسامواه جيان (6 أهداف)', 'Samuel Eto\'o (3 goals)', 'صامويل إيتو (3 أهداف)', 'Sadio Mané (3 goals)', 'ساديو ماني (3 أهداف)', 0, 'hard'],
  ['Which African country won the most AFCON titles?', 'أي دولة أفريقية فازت بأكبر عدد من ألقاب كأس أمم أفريقيا؟', 'Egypt (7)', 'مصر (7)', 'Cameroon (5)', 'الكاميرون (5)', 'Nigeria (3)', 'نيجيريا (3)', 'Algeria (2)', 'الجزائر (2)', 0, 'easy'],
  ['Who is Africa\'s all-time top scorer?', 'من هو الهداف التاريخي لأفريقيا؟', 'Samuel Eto\'o (56 goals)', 'صامويل إيتو (56 هدفاً)', 'Didier Drogba (65 goals)', 'ديدييه دروغبا (65 هدفاً)', 'Mohamed Salah (54 goals)', 'محمد صلاح (54 هدفاً)', 'Roger Milla (43 goals)', 'روجر ميلا (43 هدفاً)', 0, 'medium'],
  ['Which African team reached the 2022 WC semi-finals?', 'أي منتخب أفريقي وصل لنصف نهائي كأس العالم 2022؟', 'Morocco', 'المغرب', 'Senegal', 'السنغال', 'Egypt', 'مصر', 'Algeria', 'الجزائر', 0, 'easy'],
  ['How many African teams in 2026 World Cup?', 'كم عدد المنتخبات الأفريقية في كأس العالم 2026؟', '8', '8', '6', '6', '10', '10', '5', '5', 0, 'medium'],
  ['Which African nation has the best FIFA ranking?', 'أي دولة أفريقية لديها أفضل تصنيف فيفا؟', 'Morocco (top 15)', 'المغرب (أفضل 15)', 'Senegal (top 20)', 'السنغال (أفضل 20)', 'Egypt (top 30)', 'مصر (أفضل 30)', 'Nigeria (top 40)', 'نيجيريا (أفضل 40)', 0, 'hard'],
  ['Which African team won AFCON in 2021?', 'أي منتخب أفريقي فاز بكأس أمم أفريقيا 2021؟', 'Senegal', 'السنغال', 'Algeria', 'الجزائر', 'Egypt', 'مصر', 'Cameroon', 'الكاميرون', 0, 'easy'],
  ['Who is the most famous African footballer of all time?', 'من هو أشهر لاعب كرة قدم أفريقي على الإطلاق؟', 'Samuel Eto\'o', 'صامويل إيتو', 'Didier Drogba', 'ديدييه دروغبا', 'Mohamed Salah', 'محمد صلاح', 'George Weah', 'جورج ويا', 0, 'medium'],
  ['Which African country has won the most World Cup matches?', 'أي دولة أفريقية فازت بأكبر عدد من مباريات كأس العالم؟', 'Nigeria', 'نيجيريا', 'Cameroon', 'الكاميرون', 'Senegal', 'السنغال', 'Ghana', 'غانا', 0, 'hard'],
  ['Which African goalkeeper is considered the best ever?', 'من هو أفضل حارس مرمى أفريقي على الإطلاق？', 'Essam El-Hadary', 'عصام الحضري', 'André Onana', 'أندريه أونانا', 'Bruce Grobbelaar', 'بروس غروبيلار', 'Vincent Enyeama', 'فنسنت إنياما', 0, 'hard'],
];
for (const q of africaQs) {
  addQ('africa', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11]);
}

// European teams (20)
const euroQs = [
  ['Which European team has the most World Cup titles?', 'أي منتخب أوروبي لديه أكبر عدد من ألقاب كأس العالم？', 'Germany (4)', 'ألمانيا (4)', 'Italy (4)', 'إيطاليا (4)', 'France (2)', 'فرنسا (2)', 'Spain (1)', 'إسبانيا (1)', 0, 'easy'],
  ['Which country invented modern football?', 'أي دولة اخترعت كرة القدم الحديثة？', 'England', 'إنجلترا', 'Scotland', 'اسكتلندا', 'Italy', 'إيطاليا', 'Brazil', 'البرازيل', 0, 'easy'],
  ['Which European team has the most EURO titles?', 'أي منتخب أوروبي لديه أكبر عدد من ألقاب اليورو？', 'Spain (4)', 'إسبانيا (4)', 'Germany (3)', 'ألمانيا (3)', 'France (2)', 'فرنسا (2)', 'Italy (2)', 'إيطاليا (2)', 0, 'medium'],
  ['Which European nation has never missed a World Cup?', 'أي دولة أوروبية لم تتغيب عن أي كأس عالم？', 'Germany', 'ألمانيا', 'Italy', 'إيطاليا', 'France', 'فرنسا', 'Spain', 'إسبانيا', 0, 'hard'],
  ['Who is Europe\'s all-time top international scorer?', 'من هو الهداف التاريخي لأوروبا دولياً？', 'Cristiano Ronaldo', 'كريستيانو رونالدو', 'Robert Lewandowski', 'روبرت ليفاندوفسكي', 'Ferenc Puskás', 'فيرينتس بوشكاش', 'Gerd Müller', 'غيرد مولر', 0, 'medium'],
  ['Which European team won the first EURO in 1960?', 'أي منتخب أوروبي فاز بأول يورو 1960؟', 'Soviet Union', 'الاتحاد السوفيتي', 'Spain', 'إسبانيا', 'France', 'فرنسا', 'Italy', 'إيطاليا', 0, 'hard'],
  ['How many European teams in the 2026 World Cup?', 'كم عدد المنتخبات الأوروبية في كأس العالم 2026？', '16', '16', '12', '12', '8', '8', '20', '20', 0, 'medium'],
  ['Which European team has the most Ballon d\'Or winners?', 'أي دولة أوروبية لديها أكبر عدد من الفائزين بالكرة الذهبية؟', 'Germany', 'ألمانيا', 'France', 'فرنسا', 'Netherlands', 'هولندا', 'Italy', 'إيطاليا', 0, 'hard'],
  ['Which European club has the most UCL titles?', 'أي نادٍ أوروبي لديه أكبر عدد من ألقاب دوري الأبطال؟', 'Real Madrid (15)', 'ريال مدريد (15)', 'AC Milan (7)', 'ميلان (7)', 'Liverpool (6)', 'ليفربول (6)', 'Bayern Munich (6)', 'بايرن ميونخ (6)', 0, 'easy'],
  ['Who scored the most goals in a single EURO tournament?', 'من سجل أكبر عدد من الأهداف في بطولة يورو واحدة؟', 'Michel Platini (9 in 1984)', 'ميشيل بلاتيني (9 في 1984)', 'Cristiano Ronaldo (5 in 2020)', 'كريستيانو رونالدو (5 في 2020)', 'Antoine Griezmann (6 in 2016)', 'أنطوان غريزمان (6 في 2016)', 'Patrik Schick (5 in 2020)', 'باتريك شيك (5 في 2020)', 0, 'hard'],
];
for (const q of euroQs) {
  addQ('euro', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11]);
}

// South American (15)
const saQs = [
  ['Which South American team has the most World Cup titles?', 'أي منتخب من أمريكا الجنوبية لديه أكبر عدد من ألقاب كأس العالم؟', 'Brazil (5)', 'البرازيل (5)', 'Argentina (3)', 'الأرجنتين (3)', 'Uruguay (2)', 'الأوروغواي (2)', 'Chile (0)', 'تشيلي (0)', 0, 'easy'],
  ['Which country has won the most Copa América?', 'أي دولة فازت بأكبر عدد من كوبا أمريكا؟', 'Uruguay (15)', 'الأوروغواي (15)', 'Argentina (16)', 'الأرجنتين (16)', 'Brazil (9)', 'البرازيل (9)', 'Chile (2)', 'تشيلي (2)', 0, 'medium'],
  ['Who is Brazil\'s all-time top scorer?', 'من هو هداف البرازيل التاريخي؟', 'Pelé (77 goals)', 'بيليه (77 هدفاً)', 'Neymar (79 goals)', 'نيمار (79 هدفاً)', 'Ronaldo (62 goals)', 'رونالدو (62 هدفاً)', 'Romário (55 goals)', 'روماريو (55 هدفاً)', 0, 'medium'],
  ['Which South American team is called the "Albiceleste"?', 'أي منتخب من أمريكا الجنوبية يُسمى "الأبيض والأزرق السماوي"؟', 'Argentina', 'الأرجنتين', 'Uruguay', 'الأوروغواي', 'Chile', 'تشيلي', 'Colombia', 'كولومبيا', 0, 'easy'],
  ['Which South American team has never missed a World Cup?', 'أي منتخب من أمريكا الجنوبية لم يتغيب عن أي كأس عالم؟', 'Brazil', 'البرازيل', 'Argentina', 'الأرجنتين', 'Uruguay', 'الأوروغواي', 'Chile', 'تشيلي', 0, 'medium'],
  ['Who is Argentina\'s all-time top scorer?', 'من هو هداف الأرجنتين التاريخي؟', 'Lionel Messi (106+ goals)', 'ليونيل ميسي (106+ أهداف)', 'Gabriel Batistuta (56 goals)', 'غابرييل باتيستوتا (56 هدفاً)', 'Diego Maradona (34 goals)', 'دييغو مارادونا (34 هدفاً)', 'Sergio Agüero (42 goals)', 'سيرخيو أغويرو (42 هدفاً)', 0, 'medium'],
  ['How many FIFA World Cups has Brazil won?', 'كم عدد كؤوس العالم التي فازت بها البرازيل؟', '5', '5', '4', '4', '3', '3', '2', '2', 0, 'easy'],
  ['Which South American country hosted the 2014 World Cup?', 'أي دولة من أمريكا الجنوبية استضافت كأس العالم 2014？', 'Brazil', 'البرازيل', 'Argentina', 'الأرجنتين', 'Chile', 'تشيلي', 'Colombia', 'كولومبيا', 0, 'easy'],
  ['Who is Uruguay\'s most famous footballer?', 'من هو أشهر لاعب كرة قدم في الأوروغواي؟', 'Luis Suárez', 'لويس سواريز', 'Edinson Cavani', 'إدينسون كافاني', 'Diego Forlán', 'دييغو فورلان', 'Paolo Montero', 'باولو مونتيرو', 0, 'medium'],
  ['Which two South American teams have won the World Cup?', 'أي منتخبين من أمريكا الجنوبية فازا بكأس العالم؟', 'Brazil, Argentina, Uruguay', 'البرازيل، الأرجنتين، الأوروغواي', 'Brazil and Argentina only', 'البرازيل والأرجنتين فقط', 'Brazil and Chile', 'البرازيل وتشيلي', 'Argentina and Colombia', 'الأرجنتين وكولومبيا', 0, 'easy'],
];
for (const q of saQs) {
  addQ('sa', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11]);
}

// Asian teams (15)
const asiaQs = [
  ['Which Asian country co-hosted the 2002 World Cup?', 'أي دولة آسيوية استضافت كأس العالم 2002 بالمشاركة؟', 'South Korea and Japan', 'كوريا الجنوبية واليابان', 'Japan only', 'اليابان فقط', 'South Korea only', 'كوريا الجنوبية فقط', 'China', 'الصين', 0, 'easy'],
  ['Which Asian team has the best World Cup finish?', 'أي منتخب آسيوي لديه أفضل نتيجة في كأس العالم؟', 'South Korea (4th in 2002)', 'كوريا الجنوبية (الرابع 2002)', 'Japan (R16 2002, 2010, 2018, 2022)', 'اليابان (دور 16)', 'Saudi Arabia (R16 1994)', 'السعودية (دور 16 1994)', 'Australia (R16 2006, 2022)', 'أستراليا (دور 16)', 0, 'medium'],
  ['Which Asian country qualified for the most World Cups?', 'أي دولة آسيوية تأهلت لأكبر عدد من كؤوس العالم？', 'South Korea (11)', 'كوريا الجنوبية (11)', 'Japan (7)', 'اليابان (7)', 'Saudi Arabia (7)', 'السعودية (7)', 'Iran (6)', 'إيران (6)', 0, 'medium'],
  ['Who is Asia\'s all-time top international scorer?', 'من هو الهداف التاريخي لآسيا دولياً？', 'Ali Daei (109 goals)', 'علي دائي (109 أهداف)', 'Sunil Chhetri (94 goals)', 'سونيل تشيتري (94 هدفاً)', 'Kunishige Kamamoto (80 goals)', 'كونيشيغه كاماموتو (80 هدفاً)', 'Cha Bum-kun (58 goals)', 'تشا بوم كون (58 هدفاً)', 0, 'hard'],
  ['How many Asian teams in the 2026 World Cup?', 'كم عدد المنتخبات الآسيوية في كأس العالم 2026？', '8', '8', '6', '6', '10', '10', '12', '12', 0, 'hard'],
  ['Which Asian team won the most AFC Asian Cup titles?', 'أي منتخب آسيوي فاز بأكبر عدد من ألقاب كأس آسيا؟', 'Japan (4)', 'اليابان (4)', 'Saudi Arabia (4)', 'السعودية (4)', 'South Korea (2)', 'كوريا الجنوبية (2)', 'Iran (3)', 'إيران (3)', 0, 'medium'],
  ['Which Iranian player is a World Cup legend?', 'أي لاعب إيراني يعتبر أسطورة كأس العالم？', 'Ali Daei', 'علي دائي', 'Mehdi Mahdavikia', 'مهدي مهدويكيا', 'Javad Nekounam', 'جواد نكونام', 'Masoud Shojaei', 'مسعود شجاعي', 0, 'medium'],
  ['Which Asian country has produced the most Ballon d\'Or votes?', 'أي دولة آسيوية أنتجت أكبر عدد من أصوات الكرة الذهبية؟', 'Japan', 'اليابان', 'South Korea', 'كوريا الجنوبية', 'Australia', 'أستراليا', 'Saudi Arabia', 'السعودية', 0, 'hard'],
];
for (const q of asiaQs) {
  addQ('asia', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11]);
}

// Football rules (20)
const rulesQs = [
  ['How long is a standard football match?', 'كم تبلغ مدة مباراة كرة قدم عادية؟', '90 minutes (45x2)', '90 دقيقة (45×2)', '80 minutes', '80 دقيقة', '100 minutes', '100 دقيقة', '120 minutes', '120 دقيقة', 0, 'easy'],
  ['How many players per team on the field?', 'كم عدد اللاعبين لكل فريق في الملعب؟', '11', '11', '10', '10', '12', '12', '9', '9', 0, 'easy'],
  ['How many substitutions are allowed per match?', 'كم عدد التبديلات المسموح بها في المباراة؟', '5', '5', '3', '3', '4', '4', '6', '6', 0, 'medium'],
  ['What color card means a player is sent off?', 'ما لون البطاقة التي تعني طرد اللاعب؟', 'Red', 'حمراء', 'Yellow', 'صفراء', 'Blue', 'زرقاء', 'Green', 'خضراء', 0, 'easy'],
  ['What does VAR stand for?', 'ماذا يعني VAR؟', 'Video Assistant Referee', 'حكم الفيديو المساعد', 'Virtual Assistant Referee', 'حكم افتراضي مساعد', 'Video Action Review', 'مراجعة الفيديو', 'Visual Assistant Referee', 'حكم بصري مساعد', 0, 'easy'],
  ['When was VAR introduced to the World Cup?', 'متى تم تقديم VAR في كأس العالم？', '2018', '2018', '2014', '2014', '2022', '2022', '2010', '2010', 0, 'medium'],
  ['How long is extra time?', 'كم مدة الوقت الإضافي؟', '30 minutes (15x2)', '30 دقيقة (15×2)', '20 minutes', '20 دقيقة', '40 minutes', '40 دقيقة', '10 minutes', '10 دقائق', 0, 'easy'],
  ['What is the offside rule?', 'ما هي قاعدة التسلل؟', 'Attacker must have 2 defenders between him and goal', 'يجب أن يكون بين المهاجم والمرمى لاعبَان', 'Attacker cannot cross halfway', 'لا يمكن للمهاجم عبور منتصف الملعب', 'Goalkeeper must stay on line', 'حارس المرمى يجب أن يبقى على الخط', 'Ball must stay in play', 'يجب أن تبقى الكرة في اللعب', 0, 'medium'],
  ['What is the distance of the penalty spot?', 'ما هي مسافة نقطة الجزاء؟', '12 yards (11 metres)', '12 ياردة (11 متراً)', '10 yards', '10 ياردات', '15 yards', '15 ياردة', '18 yards', '18 ياردة', 0, 'medium'],
  ['What does the back-pass rule prohibit?', 'ماذا تمنع قاعدة الإعادة؟', 'Goalkeeper handling a pass from teammate', 'مسك حارس المرمى لتمريرة من زميله', 'Passing backwards', 'التمرير للخلف', 'Goalkeeper leaving the box', 'خروج حارس المرمى من المنطقة', 'Defenders passing to each other', 'تمرير المدافعين لبعضهم', 0, 'medium'],
  ['How many officials are on the pitch?', 'كم عدد الحكام في الملعب؟', '3 (1 referee, 2 assistants)', '3 (حكم + 2 مساعدين)', '1 referee only', 'حكم واحد فقط', '4', '4', '5', '5', 0, 'easy'],
  ['What happens after a yellow card?', 'ماذا يحدث بعد البطاقة الصفراء؟', 'Warning given to player', 'إنذار للاعب', 'Player is sent off', 'يُطرد اللاعب', 'Free kick to other team', 'ركلة حرة للفريق الآخر', 'Player substituted', 'يتم استبدال اللاعب', 0, 'easy'],
  ['Can a goal be scored directly from a goal kick?', 'هل يمكن تسجيل هدف مباشرة من ركلة مرمى？', 'Yes', 'نعم', 'No', 'لا', 'Only in professional matches', 'فقط في المباريات الاحترافية', 'Only if opponent touches', 'فقط إذا لمسها الخصم', 0, 'hard'],
  ['What is the minimum number of players for a match?', 'ما هو الحد الأدنى لعدد اللاعبين لبدء المباراة？', '7 per team', '7 لكل فريق', '8 per team', '8 لكل فريق', '9 per team', '9 لكل فريق', '10 per team', '10 لكل فريق', 0, 'hard'],
  ['When was the offside rule first introduced?', 'متى تم تقديم قاعدة التسلل لأول مرة؟', '1863', '1863', '1900', '1900', '1925', '1925', '1880', '1880', 0, 'hard'],
  ['What is the diameter of a size 5 football?', 'ما هو قطر كرة القدم مقاس 5؟', '22 cm (8.6 inches)', '22 سم', '20 cm', '20 سم', '25 cm', '25 سم', '18 cm', '18 سم', 0, 'medium'],
  ['Which rule change happened in 1992?', 'أي تغيير في القواعد حدث في 1992؟', 'Back-pass rule introduced', 'تقديم قاعدة الإعادة', 'VAR introduced', 'تقديم VAR', 'Offside rule changed', 'تغيير قاعدة التسلل', 'Yellow card introduced', 'تقديم البطاقة الصفراء', 0, 'hard'],
  ['What color must a goalkeeper wear?', 'ما اللون الذي يجب أن يرتديه حارس المرمى؟', 'Must differ from all players and officials', 'يجب أن يختلف عن اللاعبين والحكام', 'Always yellow', 'أصفر دائماً', 'Always green', 'أخضر دائماً', 'Always black', 'أسود دائماً', 0, 'easy'],
];
for (const q of rulesQs) {
  addQ('rules', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11]);
}

// Famous goals (15)
const goalQs = [
  ['Who scored the Hand of God goal?', 'من سجل هدف يد الله؟', 'Diego Maradona', 'دييغو مارادونا', 'Lionel Messi', 'ليونيل ميسي', 'Pelé', 'بيليه', 'Zinedine Zidane', 'زين الدين زيدان', 0, 'easy'],
  ['Who scored the Goal of the Century in 1986?', 'من سجل هدف القرن في 1986؟', 'Diego Maradona', 'دييغو مارادونا', 'Marco van Basten', 'ماركو فان باستن', 'Zidane', 'زيدان', 'Pelé', 'بيليه', 0, 'easy'],
  ['Who scored the winning goal in the 2014 WC final?', 'من سجل الهدف الفائز في نهائي كأس العالم 2014؟', 'Mario Götze', 'ماريو غوتسه', 'Miroslav Klose', 'ميروسلاف كلوزه', 'Thomas Müller', 'توماس مولر', 'Toni Kroos', 'توني كروس', 0, 'medium'],
  ['Who scored a hat-trick in a World Cup final?', 'من سجل هاتريك في نهائي كأس العالم؟', 'Geoff Hurst (1966)', 'جيف هيرست (1966)', 'Pelé (1958)', 'بيليه (1958)', 'Mbappé (2022)', 'مبابي (2022)', 'Zidane (1998)', 'زيدان (1998)', 0, 'medium'],
  ['Who scored the fastest WC goal (11 seconds)?', 'من سجل أسرع هدف في كأس العالم (11 ثانية)؟', 'Hakan Şükür (2002)', 'هاكان شوكور (2002)', 'Clint Dempsey (2014)', 'كلينت ديمبسي (2014)', 'Robben (2014)', 'روبن (2014)', 'Mbappé (2022)', 'مبابي (2022)', 0, 'medium'],
  ['Which player scored the \'Panenka\' penalty?', 'من سجل ركلة البانينكا الشهيرة؟', 'Antonín Panenka (1976)', 'أنتونين بانينكا (1976)', 'Andrea Pirlo (2012)', 'أندريا بيرلو (2012)', 'Sergio Ramos (2012)', 'سيرخيو راموس (2012)', 'Zlatan Ibrahimović (2004)', 'زلاتان إبراهيموفيتش (2004)', 0, 'hard'],
  ['Who scored the bicycle kick vs Aston Villa (2011)?', 'من سجل المقصية ضد أستون فيلا (2011)؟', 'Wayne Rooney', 'واين روني', 'Cristiano Ronaldo', 'كريستيانو رونالدو', 'Robin van Persie', 'روبين فان بيرسي', 'Zlatan Ibrahimović', 'زلاتان إبراهيموفيتش', 0, 'medium'],
  ['Who scored the scorpion kick goal?', 'من سجل هدف العقرب؟', 'René Higuita', 'رينيه هيغيتا', 'Zlatan Ibrahimović', 'زلاتان إبراهيموفيتش', 'Olivier Giroud', 'أوليفييه جيرو', 'Maradona', 'مارادونا', 0, 'medium'],
  ['Who scored the winning penalty in the 2022 WC final?', 'من سجل ركلة الجزاء الفائزة في نهائي 2022？', 'Gonzalo Montiel', 'غونزالو مونتييل', 'Lionel Messi', 'ليونيل ميسي', 'Kylian Mbappé', 'كيليان مبابي', 'Angel Di Maria', 'أنخيل دي ماريا', 0, 'hard'],
  ['Which player scored from the halfway line in a WC?', 'أي لاعب سجل من منتصف الملعب في كأس العالم؟', 'David Beckham (1996)', 'ديفيد بيكهام (1996)', 'Xabi Alonso (2006)', 'تشابي ألونسو (2006)', 'Steven Gerrard (2006)', 'ستيفن جيرارد (2006)', 'Frank Lampard (2010)', 'فرانك لامبارد (2010)', 0, 'hard'],
];
for (const q of goalQs) {
  addQ('goals', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11]);
}

// Finals history (12)
const finalsQs = [
  ['Which country has hosted the most World Cups?', 'أي دولة استضافت أكبر عدد من كؤوس العالم？', 'Mexico (3 times)', 'المكسيك (3 مرات)', 'Italy (2)', 'إيطاليا (مرتين)', 'France (2)', 'فرنسا (مرتين)', 'Germany (2)', 'ألمانيا (مرتين)', 0, 'medium'],
  ['Which was the highest-scoring WC final?', 'ما هو نهائي كأس العالم الأكثر تهديفاً？', 'Brazil 5-2 Sweden (1958)', 'البرازيل 5-2 السويد (1958)', 'Germany 4-2 Argentina (2014)', 'ألمانيا 4-2 الأرجنتين (2014)', 'Brazil 4-1 Italy (1970)', 'البرازيل 4-1 إيطاليا (1970)', 'Argentina 3-3 France (2022)', 'الأرجنتين 3-3 فرنسا (2022)', 0, 'hard'],
  ['Which stadium hosted the most WC finals?', 'أي ملعب استضاف أكبر عدد من نهائيات كأس العالم？', 'Estadio Azteca (2)', 'ملعب أزتيكا (2)', 'Maracanã (2)', 'الماراكانا (2)', 'Wembley (1)', 'ويمبلي (1)', 'Stade de France (1)', 'ملعب فرنسا (1)', 0, 'hard'],
  ['Which is the only team to win 3 consecutive WCs?', 'ما هو الفريق الوحيد الذي فاز بـ 3 كؤوس عالم متتالية？', 'No team has done this', 'لم يفعلها أي فريق', 'Brazil (1958-1970)', 'البرازيل (1958-1970)', 'Italy (1934-1938)', 'إيطاليا (1934-1938)', 'Argentina (2022-?)', 'الأرجنتين (2022-؟)', 0, 'hard'],
  ['When did the WC expand to 32 teams?', 'متى توسع كأس العالم إلى 32 فريقاً؟', '1998', '1998', '1994', '1994', '2002', '2002', '1986', '1986', 0, 'medium'],
  ['Which country won the most recent World Cup?', 'أي دولة فازت بأحدث كأس عالم؟', 'Argentina (2022)', 'الأرجنتين (2022)', 'France (2018)', 'فرنسا (2018)', 'Germany (2014)', 'ألمانيا (2014)', 'Spain (2010)', 'إسبانيا (2010)', 0, 'easy'],
  ['What is unique about the 2026 World Cup format?', 'ما هو الشيء الفريد في نظام كأس العالم 2026？', 'First with 48 teams and 12 groups', 'أول نسخة بـ 48 فريقاً و12 مجموعة', 'First winter World Cup', 'أول كأس عالم شتوي', 'First in Middle East', 'الأول في الشرق الأوسط', 'First with 5 substitutes', 'الأول مع 5 تبديلات', 0, 'medium'],
  ['Which World Cup had the most participating teams?', 'أي كأس عالم كان به أكبر عدد من المنتخبات المشاركة؟', '2026 (48 teams)', '2026 (48 فريقاً)', '2022 (32 teams)', '2022 (32 فريقاً)', '2018 (32 teams)', '2018 (32 فريقاً)', '2030 (48 teams)', '2030 (48 فريقاً)', 0, 'easy'],
];
for (const q of finalsQs) {
  addQ('finals', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11]);
}

// Penalty drama (12)
const penQs = [
  ['Which WC final was first decided by penalties?', 'أي نهائي كأس عالم حُسم أول مرة بركلات الترجيح؟', '1994: Brazil vs Italy', '1994: البرازيل ضد إيطاليا', '2006: Italy vs France', '2006: إيطاليا ضد فرنسا', '2022: Argentina vs France', '2022: الأرجنتين ضد فرنسا', '1978: Argentina vs Netherlands', '1978: الأرجنتين ضد هولندا', 0, 'medium'],
  ['Which team lost two WC finals on penalties?', 'أي فريق خسر نهائيين في كأس العالم بركلات الترجيح؟', 'France (2006, 2022)', 'فرنسا (2006، 2022)', 'Italy (1994, 2006)', 'إيطاليا (1994، 2006)', 'Netherlands (1974, 1978)', 'هولندا (1974، 1978)', 'Argentina (1986, 1990)', 'الأرجنتين (1986، 1990)', 0, 'medium'],
  ['Who saved 3 penalties in a WC shootout?', 'من تصدى لـ 3 ركلات ترجيح في كأس العالم？', 'Emiliano Martínez (2022)', 'إيميليانو مارتينيز (2022)', 'Gianluigi Buffon (2006)', 'جيانلويجي بوفون (2006)', 'Manuel Neuer (2014)', 'مانويل نوير (2014)', 'Iker Casillas (2010)', 'إيكر كاسياس (2010)', 0, 'hard'],
  ['How many penalties in the 2022 WC final?', 'كم ركلة جزاء في نهائي كأس العالم 2022؟', '3 penalties awarded in match', '3 ركلات جزاء', '2 penalties', 'ركلتان', '1 penalty', 'ركلة واحدة', '4 penalties', '4 ركلات', 0, 'hard'],
  ['Which WC final had the most penalty goals?', 'أي نهائي كأس عالم شهد أكبر عدد من أهداف ركلات الترجيح？', '2022: 6 penalty goals in shootout', '2022: 6 أهداف ركلات ترجيح', '1994: 5 goals', '1994: 5 أهداف', '2006: 5 goals', '2006: 5 أهداف', '2014: 5 goals', '2014: 5 أهداف', 0, 'hard'],
  ['Which goalkeeper scored a penalty in a WC?', 'أي حارس مرمى سجل ركلة جزاء في كأس العالم？', 'José Luis Chilavert (1998)', 'خوسيه لويس تشيلافيرت (1998)', 'Rogério Ceni (2002)', 'روجيريو سيني (2002)', 'Manuel Neuer (2014)', 'مانويل نوير (2014)', 'Alisson (2022)', 'أليسون (2022)', 0, 'hard'],
];
for (const q of penQs) {
  addQ('pen', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11]);
}

// Captains & legends (12)
const capsQs = [
  ['Who has the most international caps in football?', 'من لديه أكبر عدد من المباريات الدولية؟', 'Cristiano Ronaldo (200+)', 'كريستيانو رونالدو (200+)', 'Lionel Messi (180+)', 'ليونيل ميسي (180+)', 'Sergio Ramos (180+)', 'سيرخيو راموس (180+)', 'Iker Casillas (167)', 'إيكر كاسياس (167)', 0, 'medium'],
  ['Who is the youngest WC goalscorer?', 'من هو أصغر هداف في كأس العالم؟', 'Pelé (17 years, 1958)', 'بيليه (17 عاماً، 1958)', 'Mbappé (19, 2018)', 'مبابي (19، 2018)', 'Messi (18, 2006)', 'ميسي (18، 2006)', 'Ronaldo (17, 1998)', 'رونالدو (17، 1998)', 0, 'easy'],
  ['Who is the oldest World Cup winner?', 'من هو أكبر فائز بكأس العالم سناً؟', 'Dino Zoff (40 years, 1982)', 'دينو زوف (40 عاماً، 1982)', 'Miroslav Klose (36, 2014)', 'ميروسلاف كلوزه (36، 2014)', 'Lionel Messi (35, 2022)', 'ليونيل ميسي (35، 2022)', 'Cristiano Ronaldo (37)', 'كريستيانو رونالدو (37)', 0, 'hard'],
  ['Who has the most WC goals in history?', 'من لديه أكبر عدد من الأهداف في تاريخ كأس العالم؟', 'Miroslav Klose (16)', 'ميروسلاف كلوزه (16)', 'Ronaldo (15)', 'رونالدو (15)', 'Gerd Müller (14)', 'غيرد مولر (14)', 'Lionel Messi (13)', 'ليونيل ميسي (13)', 0, 'medium'],
  ['Who holds the record for most WC assists?', 'من يحمل الرقم القياسي لأكبر عدد من التمريرات الحاسمة في كأس العالم؟', 'Lionel Messi (10+)', 'ليونيل ميسي (10+)', 'Diego Maradona (8)', 'دييغو مارادونا (8)', 'Pelé (8)', 'بيليه (8)', 'Thomas Müller (8)', 'توماس مولر (8)', 0, 'hard'],
  ['Who has the most WC appearances (matches)?', 'من لديه أكبر عدد من المباريات في كأس العالم؟', 'Lionel Messi (26 matches)', 'ليونيل ميسي (26 مباراة)', 'Miroslav Klose (24)', 'ميروسلاف كلوزه (24)', 'Cristiano Ronaldo (22)', 'كريستيانو رونالدو (22)', 'Diego Maradona (21)', 'دييغو مارادونا (21)', 0, 'hard'],
];
for (const q of capsQs) {
  addQ('caps', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11]);
}

// ========================================================================
// GENERATE SQL
// ========================================================================
const catSqlMap = {
  wc2026: "(SELECT id FROM quiz_categories WHERE slug = 'wc2026-teams')",
  wch: "(SELECT id FROM quiz_categories WHERE slug = 'wc-history')",
  flag: "(SELECT id FROM quiz_categories WHERE slug = 'guess-flag')",
  player: "(SELECT id FROM quiz_categories WHERE slug = 'guess-player')",
  stadium: "(SELECT id FROM quiz_categories WHERE slug = 'stadiums')",
  arab: "(SELECT id FROM quiz_categories WHERE slug = 'arab-teams')",
  africa: "(SELECT id FROM quiz_categories WHERE slug = 'african-teams')",
  euro: "(SELECT id FROM quiz_categories WHERE slug = 'european-teams')",
  sa: "(SELECT id FROM quiz_categories WHERE slug = 'south-american-teams')",
  asia: "(SELECT id FROM quiz_categories WHERE slug = 'asian-teams')",
  rules: "(SELECT id FROM quiz_categories WHERE slug = 'football-rules')",
  goals: "(SELECT id FROM quiz_categories WHERE slug = 'famous-goals')",
  finals: "(SELECT id FROM quiz_categories WHERE slug = 'finals-history')",
  pen: "(SELECT id FROM quiz_categories WHERE slug = 'penalty-drama')",
  caps: "(SELECT id FROM quiz_categories WHERE slug = 'captains-legends')",
  lebanon: "(SELECT id FROM quiz_categories WHERE slug = 'lebanese-fan-culture')"
};

let sql = '-- QuizGoal 2026 — 500 Questions (auto-generated, no duplicates)\n';
sql += 'DELETE FROM quiz_battle_answers;\nDELETE FROM quiz_questions;\n\n';
sql += 'INSERT INTO quiz_questions (category_id, question_en, question_ar, answers_en, answers_ar, correct_answer_index, difficulty, explanation_en, explanation_ar, active) VALUES\n';

const rows = questions.map(q => {
  const catSql = catSqlMap[q.cat];
  return `(${catSql},\n  ${JSON.stringify(q.en)},\n  ${JSON.stringify(q.ar)},\n  ${JSON.stringify(q.ans)},\n  ${JSON.stringify(q.ansa)},\n  ${q.correct},\n  '${q.diff}',\n  ${JSON.stringify(q.exp)},\n  ${JSON.stringify(q.expa)},\n  true)`;
});

sql += rows.join(',\n') + ';\n';

const path = 'C:/Users/Dell/Desktop/quizgoal26/src/db/questions_500.sql';
fs.writeFileSync(path, sql);
console.log('Generated ' + questions.length + ' unique questions -> ' + path);

// Stats per category
const stats = {};
for (const q of questions) {
  stats[q.cat] = (stats[q.cat] || 0) + 1;
}
console.log('\nPer category:');
for (const [cat, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat} (${categories[cat].name}): ${count}`);
}
