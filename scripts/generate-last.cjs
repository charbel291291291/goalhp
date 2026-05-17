const fs = require('fs');
const existingContent = fs.readFileSync('C:/Users/Dell/Desktop/quizgoal26/src/db/questions_500.sql', 'utf8');
const moreContent = fs.readFileSync('C:/Users/Dell/Desktop/quizgoal26/src/db/questions_more.sql', 'utf8');
const usedKeys = new Set();
for (const text of [existingContent, moreContent]) {
  const matches = text.match(/"question_en":"([^"]+)"/g) || [];
  for (const m of matches) {
    const val = JSON.parse('{' + m + '}').question_en;
    usedKeys.add(val.toLowerCase().replace(/[^a-z0-9]/g, ''));
  }
}
const questions = [];
function addQ(cat, en, ar, ans, ansa, correct, diff, exp, expa) {
  const key = en.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (usedKeys.has(key)) return false;
  usedKeys.add(key);
  questions.push({ cat, en, ar, ans: JSON.stringify(ans), ansa: JSON.stringify(ansa), correct, diff, exp: exp || '', expa: expa || '' });
  return true;
}
function make4(correctEn, correctAr, poolEn, poolAr) {
  const wrong = poolEn.filter(x => x !== correctEn).sort(() => Math.random() - 0.5).slice(0, 3);
  const optsEn = [correctEn, ...wrong].sort(() => Math.random() - 0.5);
  const optsAr = optsEn.map(o => o === correctEn ? correctAr : (poolAr[poolEn.indexOf(o)] || o));
  return { ans: optsEn, ansa: optsAr, correctIdx: optsEn.indexOf(correctEn) };
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

let c = 0;
const teamsEn = ['Mexico','South Africa','Korea Republic','Czechia','Canada','Bosnia and Herzegovina','Qatar','Switzerland','Brazil','Morocco','Haiti','Scotland','USA','Paraguay','Australia','Türkiye','Germany','Curaçao',"Côte d'Ivoire",'Ecuador','Netherlands','Japan','Tunisia','Sweden','Belgium','Egypt','IR Iran','New Zealand','Spain','Cabo Verde','Saudi Arabia','Uruguay','France','Senegal','Iraq','Norway','Argentina','Algeria','Austria','Jordan','Portugal','Colombia','Uzbekistan','Congo DR','England','Croatia','Ghana','Panama'];
const teamsAr = ['المكسيك','جنوب أفريقيا','كوريا الجنوبية','التشيك','كندا','البوسنة والهرسك','قطر','سويسرا','البرازيل','المغرب','هايتي','اسكتلندا','الولايات المتحدة','باراغواي','أستراليا','تركيا','ألمانيا','كوراساو','ساحل العاج','الإكوادور','هولندا','اليابان','تونس','السويد','بلجيكا','مصر','إيران','نيوزيلندا','إسبانيا','كابو فيردي','السعودية','الأوروغواي','فرنسا','السنغال','العراق','النرويج','الأرجنتين','الجزائر','النمسا','الأردن','البرتغال','كولومبيا','أوزبكستان','الكونغو الديمقراطية','إنجلترا','كرواتيا','غانا','بنما'];

// WC2026 extra trivia
for (let i = 0; i < 15; i++) {
  const t = teamsEn[i];
  const p = make4(t, teamsAr[i], teamsEn, teamsAr);
  if (addQ('wc2026', `Which team plays in ${['North America','Africa','Europe','South America','Asia'][i%5]}?`, `أي منتخب يلعب في ${['أمريكا الشمالية','أفريقيا','أوروبا','أمريكا الجنوبية','آسيا'][i%5]}؟`,
    p.ans, p.ansa, p.correctIdx, 'easy', `${t} location`, `موقع ${teamsAr[i]}`)) c++;
}

// Player - which country
const playersC = [
  ['Lionel Messi','Argentina','ليونيل ميسي','الأرجنتين'],['Cristiano Ronaldo','Portugal','كريستيانو رونالدو','البرتغال'],
  ['Neymar','Brazil','نيمار','البرازيل'],['Mbappé','France','مبابي','فرنسا'],['Salah','Egypt','صلاح','مصر'],
  ['Haaland','Norway','هالاند','النرويج'],['Lewandowski','Poland','ليفاندوفسكي','بولندا'],['De Bruyne','Belgium','دي بروين','بلجيكا'],
  ['Modrić','Croatia','مودريتش','كرواتيا'],['Benzema','France','بنزيما','فرنسا'],['Mané','Senegal','ماني','السنغال'],
  ['Mahrez','Algeria','مح رز','الجزائر'],['Osimhen','Nigeria','أوسيمين','نيجيريا'],['Son Heung-min','South Korea','سون هيونغ مين','كوريا الجنوبية'],
  ['Kane','England','كين','إنجلترا'],['Mbappé','France','مبابي','فرنسا'],['Griezmann','France','غريزمان','فرنسا'],
  ['Vinícius Jr','Brazil','فينيسيوس','البرازيل'],['Bellingham','England','بيلينغهام','إنجلترا'],['Musiala','Germany','موسيالا','ألمانيا']
];
for (const p of playersC) {
  const pool = make4(p[0], p[2], playersC.map(x => x[0]), playersC.map(x => x[2]));
  if (addQ('player', `What nationality is ${p[0]}?`, `ما جنسية ${p[2]}؟`,
    pool.ans, pool.ansa, pool.correctIdx, 'easy', `${p[0]} is ${p[1]}`, `${p[2]} من ${p[3]}`)) c++;
}

// More finals questions
const finalsExtra = [
  ['Which World Cup final was held at the Maracanã?','أي نهائي كأس عالم أُقيم في الماراكانا؟','1950 (Uruguay vs Brazil)','1950 (الأوروغواي ضد البرازيل)','2014 (Germany vs Argentina)','2014 (ألمانيا ضد الأرجنتين)','1998 (France vs Brazil)','1998 (فرنسا ضد البرازيل)','1970 (Brazil vs Italy)','1970 (البرازيل ضد إيطاليا)',0,'medium'],
  ['Which was the only all-European World Cup final?','ما هو النهائي الأوروبي الوحيد في كأس العالم؟','Spain vs Netherlands (2010)','إسبانيا ضد هولندا (2010)','Italy vs France (2006)','إيطاليا ضد فرنسا (2006)','France vs Croatia (2018)','فرنسا ضد كرواتيا (2018)','Germany vs Argentina (2014)','ألمانيا ضد الأرجنتين (2014)',0,'hard'],
  ['Which country hosted the 2010 World Cup?','أي دولة استضافت كأس العالم 2010؟','South Africa','جنوب أفريقيا','Brazil','البرازيل','Germany','ألمانيا','Russia','روسيا',0,'easy'],
  ['Which country hosted the 2014 World Cup?','أي دولة استضافت كأس العالم 2014؟','Brazil','البرازيل','Qatar','قطر','Russia','روسيا','South Africa','جنوب أفريقيا',0,'easy'],
  ['Which country hosted the 2018 World Cup?','أي دولة استضافت كأس العالم 2018؟','Russia','روسيا','Qatar','قطر','Brazil','البرازيل','South Africa','جنوب أفريقيا',0,'easy'],
];
for (const q of finalsExtra) {
  if (addQ('finals', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11])) c++;
}

// More penalty drama
const penExtra = [
  ['How many penalty shootouts happened in the 2022 WC?','كم عدد ركلات الترجيح في كأس العالم 2022؟','4 shootouts','4', '2','2', '3','3', '5','5',0,'hard'],
  ['Which team won the 2006 WC on penalties?','أي فريق فاز بكأس العالم 2006 بركلات الترجيح؟','Italy','إيطاليا','France','فرنسا','Germany','ألمانيا','Portugal','البرتغال',0,'medium'],
  ['Who missed the crucial penalty in the 1994 WC final?','من أضاع ركلة الجزاء الحاسمة في نهائي 1994؟','Roberto Baggio','روبرتو باجيو','Franco Baresi','فرانكو باريزي','Daniele Massaro','دانييلي ماسارو','Alberico Evani','البيريكو إيفاني',0,'medium'],
];
for (const q of penExtra) {
  if (addQ('pen', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11])) c++;
}

// More legends
const capsExtra = [
  ['Which captain lifted the 2022 World Cup trophy?','أي كابتن رفع كأس العالم 2022؟','Lionel Messi','ليونيل ميسي','Hugo Lloris','هوغو لوريس','Harry Kane','هاري كين','Cristiano Ronaldo','كريستيانو رونالدو',0,'easy'],
  ['Which captain lifted the 2018 World Cup trophy?','أي كابتن رفع كأس العالم 2018؟','Hugo Lloris','هوغو لوريس','Lionel Messi','ليونيل ميسي','Kylian Mbappé','كيليان مبابي','Antoine Griezmann','أنطوان غريزمان',0,'easy'],
  ['How many captains have won the World Cup as captain?','كم عدد القادة الذين فازوا بكأس العالم كقائد؟','17 captains (1930-2022)','17 قائداً (1930-2022)','22 captains','22 قائداً','10 captains','10 قادة','All winning captains','جميع القادة الفائزين',0,'hard'],
];
for (const q of capsExtra) {
  if (addQ('caps', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11])) c++;
}

// More goals
const goalsExtra = [
  ['Who scored the goal that won the 2010 World Cup for Spain?','من سجل الهدف الذي فاز بكأس العالم 2010 لإسبانيا؟','Andrés Iniesta','أندريس إنييستا','David Villa','دافيد فيا','Xavi','تشافي','Fernando Torres','فرناندو توريس',0,'medium'],
  ['Who scored the header goal in the 1998 WC final?','من سجل الهدف الرأسي في نهائي 1998؟','Zinedine Zidane','زين الدين زيدان','Emmanuel Petit','إيمانويل بوتي','Lilian Thuram','ليليان تورام','Youri Djorkaeff','يوري دجوركاييف',0,'medium'],
  ['Who scored the only goal of the 2010 WC final?','من سجل الهدف الوحيد في نهائي 2010؟','Andrés Iniesta','أندريس إنييستا','David Villa','دافيد فيا','Xavi','تشافي','Sergio Ramos','سيرخيو راموس',0,'easy'],
];
for (const q of goalsExtra) {
  if (addQ('goals', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11])) c++;
}

// More SA
const saExtra = [
  ['Which country has won the Copa América the most?','أي دولة فازت بكوبا أمريكا لأكبر عدد؟','Argentina (16)','الأرجنتين (16)','Uruguay (15)','الأوروغواي (15)','Brazil (9)','البرازيل (9)','Chile (2)','تشيلي (2)',0,'medium'],
  ['Which South American country has no World Cup title?','أي دولة من أمريكا الجنوبية ليس لديها لقب كأس عالم؟','Chile, Colombia, Paraguay, Ecuador, Peru','تشيلي، كولومبيا، باراغواي، الإكوادور، بيرو','Argentina','الأرجنتين','Uruguay','الأوروغواي','Brazil','البرازيل',0,'easy'],
  ['Who is Argentina\'s second all-time top scorer?','من هو ثاني هداف الأرجنتين التاريخي؟','Gabriel Batistuta (56 goals)','غابرييل باتيستوتا (56 هدفاً)','Sergio Agüero (42 goals)','سيرخيو أغويرو (42 هدفاً)','Diego Maradona (34 goals)','دييغو مارادونا (34 هدفاً)','Ángel Di María (31 goals)','أنخيل دي ماريا (31 هدفاً)',0,'hard'],
];
for (const q of saExtra) {
  if (addQ('sa', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11])) c++;
}

// More rules
const rulesExtra = [
  ['What is the minimum referee count for a FIFA match?','ما هو الحد الأدنى لعدد الحكام في مباراة الفيفا؟','4 (1 referee + 2 assistants + 4th official)','4 (حكم + 2 مساعدين + حكم رابع)','3','3','5','5','2','2',0,'medium'],
  ['Can a substitute be sent off before entering the pitch?','هل يمكن طرد بديل قبل دخوله الملعب؟','Yes','نعم','No','لا','Only for violent conduct','فقط للسلوك العنيف','Only if they argue','فقط إذا احتج',0,'hard'],
  ['Does a goal count if the referee blows the whistle before it enters?','هل تحتسب هدف إذا أطلق الحكم الصافرة قبل دخوله؟','No','لا','Yes','نعم','Depends on the referee','يعتمد على الحكم','Only if it was offside','فقط إذا كان تسللاً',0,'hard'],
];
for (const q of rulesExtra) {
  if (addQ('rules', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11])) c++;
}

// Generate SQL
let sql = '';
const rows = questions.map(q => {
  const catSql = catSqlMap[q.cat];
  return `(${catSql},\n  ${JSON.stringify(q.en)},\n  ${JSON.stringify(q.ar)},\n  ${JSON.stringify(q.ans)},\n  ${JSON.stringify(q.ansa)},\n  ${q.correct},\n  '${q.diff}',\n  ${JSON.stringify(q.exp)},\n  ${JSON.stringify(q.expa)},\n  true)`;
});
sql += 'INSERT INTO quiz_questions (category_id, question_en, question_ar, answers_en, answers_ar, correct_answer_index, difficulty, explanation_en, explanation_ar, active) VALUES\n';
sql += rows.join(',\n') + ';\n';
fs.writeFileSync('C:/Users/Dell/Desktop/quizgoal26/src/db/questions_last.sql', sql);
console.log('Added ' + questions.length + ' more -> total available: ' + (434 + questions.length));
