const fs = require('fs');

const usedKeys = new Set();
for (const file of ['questions_500.sql', 'questions_more.sql', 'questions_last.sql']) {
  const content = fs.readFileSync(`C:/Users/Dell/Desktop/quizgoal26/src/db/${file}`, 'utf8');
  const matches = content.match(/"question_en":"([^"]+)"/g) || [];
  for (const m of matches) {
    try {
      const val = JSON.parse(`{${m}}`).question_en;
      usedKeys.add(val.toLowerCase().replace(/[^a-z0-9]/g, ''));
    } catch (e) {}
  }
}

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

function r(en) {
  usedKeys.add(en.toLowerCase().replace(/[^a-z0-9]/g, ''));
}

function add(cat, en, ar, opts, optsAr, c, diff, exp, expa) {
  const key = en.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (usedKeys.has(key)) return null;
  usedKeys.add(key);
  return `(${catSqlMap[cat]},\n  ${JSON.stringify(en)},\n  ${JSON.stringify(ar)},\n  ${JSON.stringify(JSON.stringify(opts))},\n  ${JSON.stringify(JSON.stringify(optsAr))},\n  ${c},\n  '${diff}',\n  ${JSON.stringify(exp || '')},\n  ${JSON.stringify(expa || '')},\n  true)`;
}

const rows = [];

// Manually add 25+ unique questions
let x;
x = add('wc2026', 'Which Asian teams are in the 2026 World Cup?', 'ما هي المنتخبات الآسيوية في كأس العالم 2026؟',
  ['Korea Republic, Japan, Saudi Arabia, Australia, Iran, Iraq, Jordan, Uzbekistan'],
  ['كوريا الجنوبية، اليابان، السعودية، أستراليا، إيران، العراق، الأردن، أوزبكستان'],
  0, 'hard', '8 Asian teams qualified', '8 منتخبات آسيوية تأهلت'); if (x) rows.push(x);

x = add('wc2026', 'Which European teams are in the 2026 WC?', 'ما هي المنتخبات الأوروبية في كأس العالم 2026؟',
  ['Czechia, Switzerland, Bosnia, Scotland, Netherlands, Sweden, Belgium, Norway, Austria, Croatia, England, Portugal, Germany, France, Spain, Türkiye'],
  ['التشيك، سويسرا، البوسنة، اسكتلندا، هولندا، السويد، بلجيكا، النرويج، النمسا، كرواتيا، إنجلترا، البرتغال، ألمانيا، فرنسا، إسبانيا، تركيا'],
  0, 'hard', '16 European teams', '16 منتخباً أوروبياً'); if (x) rows.push(x);

x = add('wc2026', 'Which South American teams are in the 2026 WC?', 'ما هي منتخبات أمريكا الجنوبية في كأس العالم 2026؟',
  ['Brazil, Argentina, Uruguay, Paraguay, Colombia, Ecuador'],
  ['البرازيل، الأرجنتين، الأوروغواي، باراغواي، كولومبيا، الإكوادور'],
  0, 'hard', '6 South American teams', '6 منتخبات من أمريكا الجنوبية'); if (x) rows.push(x);

x = add('wc2026', 'Which CONCACAF teams are in the 2026 WC?', 'ما هي منتخبات الكونكاكاف في كأس العالم 2026؟',
  ['USA, Canada, Mexico, Haiti, Panama'],
  ['الولايات المتحدة، كندا، المكسيك، هايتي، بنما'],
  0, 'hard', '5 CONCACAF teams', '5 منتخبات من الكونكاكاف'); if (x) rows.push(x);

x = add('wc2026', 'What is the new format for the 2026 WC knockout stage?', 'ما هو النظام الجديد لدور خروج المغلوب في 2026؟',
  ['Top 2 from each group plus 8 best third-placed teams to R32', 'R16 only', 'Only group winners advance', 'Top 3 from each group advance'],
  ['أول 2 من كل مجموعة + أفضل 8 فرق ثالثة إلى دور الـ 32', 'دور الـ 16 فقط', 'فقط الفائزون بالمجموعات', 'أول 3 من كل مجموعة'],
  0, 'hard', '48 teams: R32 -> R16 -> QF -> SF -> F', '48 فريقاً: دور 32 -> دور 16 -> ربع -> نصف -> نهائي'); if (x) rows.push(x);

x = add('wch', 'Which country won the first World Cup in 1930?', 'أي دولة فازت بأول كأس عالم في 1930؟',
  ['Uruguay', 'Argentina', 'Brazil', 'Italy'],
  ['الأوروغواي', 'الأرجنتين', 'البرازيل', 'إيطاليا'],
  0, 'easy', 'Uruguay won the first WC in 1930', 'الأوروغواي فازت بأول كأس عالم 1930'); if (x) rows.push(x);

x = add('wch', 'Which country hosted the first World Cup?', 'أي دولة استضافت أول كأس عالم؟',
  ['Uruguay', 'Argentina', 'Brazil', 'Italy'],
  ['الأوروغواي', 'الأرجنتين', 'البرازيل', 'إيطاليا'],
  0, 'easy', 'Uruguay hosted in 1930.', 'الأوروغواي استضافت في 1930.'); if (x) rows.push(x);

x = add('flag', 'Which country has a flag with a palm tree and two crossed swords?', 'أي دولة علمها يحتوي على نخلة وسيفين متقاطعين؟',
  ['Saudi Arabia', 'Iraq', 'Kuwait', 'Jordan'],
  ['السعودية', 'العراق', 'الكويت', 'الأردن'],
  0, 'medium', 'Saudi flag features palm and crossed swords', 'علم السعودية يحتوي على نخلة وسيفين'); if (x) rows.push(x);

x = add('player', 'Which Portuguese player has scored the most international goals?', 'أي لاعب برتغالي سجل أكبر عدد من الأهداف الدولية؟',
  ['Cristiano Ronaldo', 'Eusébio', 'Luis Figo', 'Rui Costa'],
  ['كريستيانو رونالدو', 'أوزيبيو', 'لويس فيغو', 'روي كوستا'],
  0, 'easy', 'CR7 is the all-time top scorer', 'CR7 هو الهداف التاريخي'); if (x) rows.push(x);

x = add('player', 'Which French player has won the most World Cups?', 'أي لاعب فرنسي فاز بأكبر عدد من كؤوس العالم؟',
  ['Kylian Mbappé (2018)', 'Zinedine Zidane (1998)', 'Antoine Griezmann (2018)', 'Didier Deschamps (1998)'],
  ['كيليان مبابي (2018)', 'زين الدين زيدان (1998)', 'أنطوان غريزمان (2018)', 'ديدييه ديشان (1998)'],
  0, 'easy', 'Mbappé won in 2018.', 'مبابي فاز في 2018.'); if (x) rows.push(x);

x = add('stadium', 'What is the largest stadium in the world?', 'ما هو أكبر ملعب في العالم؟',
  ['Rungrado 1st of May (114,000)', 'Narendra Modi Stadium (132,000)', 'Camp Nou (99,354)', 'Maracanã (78,838)'],
  ['ملعب رونغرادو (114,000)', 'ملعب ناريندرا مودي (132,000)', 'كامب نو (99,354)', 'الماراكانا (78,838)'],
  1, 'medium', 'Narendra Modi Stadium is largest by capacity', 'ملعب ناريندرا مودي هو الأكبر'); if (x) rows.push(x);

x = add('stadium', 'What is the largest football-specific stadium in Europe?', 'ما هو أكبر ملعب كرة قدم مخصص في أوروبا؟',
  ['Camp Nou (99,354)', 'Wembley (90,000)', 'Signal Iduna Park (81,365)', 'San Siro (80,018)'],
  ['كامب نو (99,354)', 'ويمبلي (90,000)', 'سيغنال إيدونا بارك (81,365)', 'سان سيرو (80,018)'],
  0, 'medium', 'Camp Nou is Europe\'s largest', 'كامب نو هو الأكبر في أوروبا'); if (x) rows.push(x);

x = add('arab', 'How many times has Tunisia qualified for the World Cup?', 'كم مرة تأهلت تونس لكأس العالم؟',
  ['6 (1978, 1998, 2002, 2006, 2018, 2022)', '4', '5', '3'],
  ['6 (1978، 1998، 2002، 2006، 2018، 2022)', '4', '5', '3'],
  0, 'medium', 'Tunisia has 6 WC appearances', 'تونس لديها 6 مشاركات'); if (x) rows.push(x);

x = add('arab', 'How many times has Algeria qualified for the World Cup?', 'كم مرة تأهلت الجزائر لكأس العالم؟',
  ['4 (1982, 1986, 2010, 2014)', '3', '5', '2'],
  ['4 (1982، 1986، 2010، 2014)', '3', '5', '2'],
  0, 'medium', 'Algeria has 4 WC appearances', 'الجزائر لديها 4 مشاركات'); if (x) rows.push(x);

x = add('africa', 'Which African team has the most World Cup wins?', 'أي منتخب أفريقي لديه أكبر عدد من الانتصارات في كأس العالم؟',
  ['Nigeria (6 wins)', 'Cameroon (5 wins)', 'Senegal (5 wins)', 'Ghana (4 wins)'],
  ['نيجيريا (6 انتصارات)', 'الكاميرون (5 انتصارات)', 'السنغال (5 انتصارات)', 'غانا (4 انتصارات)'],
  0, 'hard', 'Nigeria has 6 WC wins', 'نيجيريا لديها 6 انتصارات'); if (x) rows.push(x);

x = add('euro', 'Which European country has the most FIFA World Cup Best Player awards?', 'أي دولة أوروبية لديها أكبر عدد من جوائز أفضل لاعب في كأس العالم؟',
  ['Germany (3)', 'France (2)', 'Italy (1)', 'Spain (1)'],
  ['ألمانيا (3)', 'فرنسا (2)', 'إيطاليا (1)', 'إسبانيا (1)'],
  0, 'hard', 'Germany leads with 3 awards', 'ألمانيا تتصدر بـ 3 جوائز'); if (x) rows.push(x);

x = add('sa', 'Which country has the best win rate in Copa América history?', 'أي دولة لديها أفضل نسبة فوز في تاريخ كوبا أمريكا؟',
  ['Argentina', 'Brazil', 'Uruguay', 'Chile'],
  ['الأرجنتين', 'البرازيل', 'الأوروغواي', 'تشيلي'],
  0, 'hard', 'Argentina has best Copa América win rate', 'الأرجنتين لديها أفضل نسبة فوز'); if (x) rows.push(x);

x = add('asia', 'Which Asian player has scored the most World Cup goals?', 'أي لاعب آسيوي سجل أكبر عدد من الأهداف في كأس العالم？',
  ['Ahn Jung-hwan (3 goals)', 'Tim Cahill (5 goals)', 'Son Heung-min (3 goals)', 'Ali Daei (2 goals)'],
  ['آن جونغ هوان (3 أهداف)', 'تيم كاهيل (5 أهداف)', 'سون هيونغ مين (3 أهداف)', 'علي دائي (هدفان)'],
  0, 'hard', 'Ahn Jung-hwan has 3 WC goals (Korean record)', 'آن جونغ هوان لديه 3 أهداف'); if (x) rows.push(x);

x = add('rules', 'Can a goalkeeper score a goal from a goal kick?', 'هل يمكن لحارس المرمى تسجيل هدف من ركلة مرمى؟',
  ['Yes, if it goes into opponent goal', 'No', 'Only if wind-assisted', 'Only in friendly matches'],
  ['نعم، إذا دخلت مرمى الخصم', 'لا', 'فقط بمساعدة الرياح', 'فقط في المباريات الودية'],
  0, 'medium', 'A goal kick goal counts if it goes directly in', 'تحتسب هدف من ركلة مرمى إذا دخلت مباشرة'); if (x) rows.push(x);

x = add('goals', 'Which player scored a goal directly from a corner kick in the World Cup?', 'أي لاعب سجل هدفاً مباشراً من ركلة ركنية في كأس العالم？',
  ['Marco Rodríguez (Mexico, 1998)', 'David Beckham (2002)', 'Roberto Carlos (1998)', 'Pelé (1958)'],
  ['ماركو رودريغيز (المكسيك، 1998)', 'ديفيد بيكهام (2002)', 'روبرتو كارلوس (1998)', 'بيليه (1958)'],
  0, 'hard', 'Marco Rodríguez scored an Olympic goal in 1998', 'ماركو رودريغيز سجل هدفاً أولمبياً في 1998'); if (x) rows.push(x);

x = add('pen', 'Which World Cup final had penalties for the first time?', 'أي نهائي كأس عالم شهد ركلات ترجيح لأول مرة？',
  ['1994 Brazil vs Italy', '2006 Italy vs France', '2022 Argentina vs France', '1978 Argentina vs Netherlands'],
  ['1994 البرازيل ضد إيطاليا', '2006 إيطاليا ضد فرنسا', '2022 الأرجنتين ضد فرنسا', '1978 الأرجنتين ضد هولندا'],
  0, 'medium', '1994 was the first penalty shootout final', '1994 كان أول نهائي بركلات الترجيح'); if (x) rows.push(x);

x = add('caps', 'Which player has the most caps as captain?', 'أي لاعب لديه أكبر عدد من المباريات كقائد؟',
  ['Sergio Ramos', 'Lionel Messi', 'Cristiano Ronaldo', 'Paolo Maldini'],
  ['سيرخيو راموس', 'ليونيل ميسي', 'كريستيانو رونالدو', 'باولو مالديني'],
  0, 'hard', 'Sergio Ramos has the most as captain', 'سيرخيو راموس لديه الأكثر كقائد'); if (x) rows.push(x);

x = add('lebanon', 'Which city hosts the most Lebanese football matches?', 'أي مدينة تستضيف أكبر عدد من مباريات كرة القدم اللبنانية？',
  ['Beirut', 'Tripoli', 'Sidon', 'Zahle'],
  ['بيروت', 'طرابلس', 'صيدا', 'زحلة'],
  0, 'easy', 'Beirut hosts most matches', 'بيروت تستضيف معظم المباريات'); if (x) rows.push(x);

x = add('finals', 'Which was the lowest-scoring World Cup final?', 'ما هو نهائي كأس العالم الأقل تهديفاً؟',
  ['1994 Brazil 0-0 Italy (3-2 pens)', '2010 Spain 1-0 Netherlands', '2006 Italy 1-1 France (5-3 pens)', '2014 Germany 1-0 Argentina'],
  ['1994 البرازيل 0-0 إيطاليا (3-2 ر.ت)', '2010 إسبانيا 1-0 هولندا', '2006 إيطاليا 1-1 فرنسا (5-3 ر.ت)', '2014 ألمانيا 1-0 الأرجنتين'],
  0, 'medium', '1994 final ended 0-0 after extra time', 'نهائي 1994 انتهى 0-0 بعد الوقت الإضافي'); if (x) rows.push(x);

x = add('finals', 'Which country appeared in the most World Cup finals?', 'أي دولة ظهرت في أكبر عدد من نهائيات كأس العالم؟',
  ['Germany (8 finals)', 'Brazil (7 finals)', 'Italy (6 finals)', 'Argentina (6 finals)'],
  ['ألمانيا (8 نهائيات)', 'البرازيل (7 نهائيات)', 'إيطاليا (6 نهائيات)', 'الأرجنتين (6 نهائيات)'],
  0, 'medium', 'Germany has 8 final appearances', 'ألمانيا لديها 8 مشاركات في النهائي'); if (x) rows.push(x);

if (rows.length > 0) {
  let sql = 'INSERT INTO quiz_questions (category_id, question_en, question_ar, answers_en, answers_ar, correct_answer_index, difficulty, explanation_en, explanation_ar, active) VALUES\n';
  sql += rows.join(',\n') + ';\n';
  fs.writeFileSync('C:/Users/Dell/Desktop/quizgoal26/src/db/questions_final.sql', sql);
}

console.log(`Added ${rows.length} final unique questions`);
console.log(`Total: 478 + ${rows.length} = ${478 + rows.length}`);
