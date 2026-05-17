const fs = require('fs');

const teamNamesEn = ['Mexico','South Africa','Korea Republic','Czechia','Canada','Bosnia and Herzegovina','Qatar','Switzerland','Brazil','Morocco','Haiti','Scotland','USA','Paraguay','Australia','Türkiye','Germany','Curaçao',"Côte d'Ivoire",'Ecuador','Netherlands','Japan','Tunisia','Sweden','Belgium','Egypt','IR Iran','New Zealand','Spain','Cabo Verde','Saudi Arabia','Uruguay','France','Senegal','Iraq','Norway','Argentina','Algeria','Austria','Jordan','Portugal','Colombia','Uzbekistan','Congo DR','England','Croatia','Ghana','Panama'];
const teamNamesAr = ['المكسيك','جنوب أفريقيا','كوريا الجنوبية','التشيك','كندا','البوسنة والهرسك','قطر','سويسرا','البرازيل','المغرب','هايتي','اسكتلندا','الولايات المتحدة','باراغواي','أستراليا','تركيا','ألمانيا','كوراساو','ساحل العاج','الإكوادور','هولندا','اليابان','تونس','السويد','بلجيكا','مصر','إيران','نيوزيلندا','إسبانيا','كابو فيردي','السعودية','الأوروغواي','فرنسا','السنغال','العراق','النرويج','الأرجنتين','الجزائر','النمسا','الأردن','البرتغال','كولومبيا','أوزبكستان','الكونغو الديمقراطية','إنجلترا','كرواتيا','غانا','بنما'];

// Read existing questions to avoid duplicates
const existingContent = fs.readFileSync('C:/Users/Dell/Desktop/quizgoal26/src/db/questions_500.sql', 'utf8');
const questions = [];
const usedKeys = new Set();
const existingMatches = existingContent.match(/"question_en":"([^"]+)"/g) || [];
for (const m of existingMatches) {
  const val = JSON.parse('{' + m + '}').question_en;
  usedKeys.add(val.toLowerCase().replace(/[^a-z0-9]/g, ''));
}

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

let count = 0;

// Add more WC2026 team trivia
for (let i = 0; i < 30; i++) {
  const tIdx = i % 48;
  const tEn = teamNamesEn[tIdx];
  const tAr = teamNamesAr[tIdx];
  if (addQ('wc2026', `What is the FIFA code for ${tEn}?`, `ما هو رمز الفيفا لـ ${tAr}？`,
    [tEn, teamNamesEn[(tIdx+10)%48], teamNamesEn[(tIdx+20)%48], teamNamesEn[(tIdx+30)%48]],
    [tAr, teamNamesAr[(tIdx+10)%48], teamNamesAr[(tIdx+20)%48], teamNamesAr[(tIdx+30)%48]],
    0, 'hard', `${tEn} code varies`, `رمز ${tAr} متغير`)) count++;
}

// Add football terminology questions
const terms = [
  ['What is a "hat-trick"?', 'ما هي "الهاتريك"؟', '3 goals by one player in a match', '3 أهداف للاعب واحد في مباراة', '3 consecutive wins', '3 انتصارات متتالية', '3 saves by a goalkeeper', '3 تصديات لحارس', '3 penalties awarded', '3 ركلات جزاء', 0, 'easy'],
  ['What does "Clean sheet" mean?', 'ماذا يعني "شباك نظيفة"؟', 'Goalkeeper concedes no goals', 'لم يستقبل حارس المرمى أي أهداف', 'No fouls in the match', 'لا أخطاء في المباراة', 'Team wins without scoring', 'فريق يفوز دون تسجيل', 'Stadium is empty', 'الملعب فارغ', 0, 'easy'],
  ['What is a "derby" match?', 'ما هي مباراة "الديربي"؟', 'Match between local rivals', 'مباراة بين غريمين محليين', 'Match on a Wednesday', 'مباراة يوم الأربعاء', 'Final match of the season', 'المباراة النهائية للموسم', 'Match with no goals', 'مباراة بدون أهداف', 0, 'easy'],
  ['What does "Tiki-taka" describe?', 'ماذا يصف "تيكي تاكا"؟', 'Short passing possession style', 'أسلوب التمريرات القصيرة والاستحواذ', 'Long ball tactic', 'تكتيك الكرات الطويلة', 'Defensive formation', 'تشكيل دفاعي', 'Counter-attack strategy', 'استراتيجية الهجوم المرتد', 0, 'medium'],
  ['What is a "Catenaccio" system?', 'ما هو نظام "كاتيناتشيو"؟', 'Defensive Italian system', 'النظام الدفاعي الإيطالي', 'Attacking Dutch system', 'النظام الهجومي الهولندي', 'Brazilian samba style', 'أسلوب السامبا البرازيلي', 'German pressing', 'الضغط الألماني', 0, 'hard'],
  ['What is "Total Football"?', 'ما هي "كرة القدم الشاملة"؟', 'Dutch system where players interchange positions', 'النظام الهولندي حيث يتبادل اللاعبون المراكز', 'All players must score', 'جميع اللاعبين يجب أن يسجلوا', 'No goalkeepers allowed', 'لا يسمح بحراس المرمى', '11 strikers tactic', 'تكتيك 11 مهاجماً', 0, 'medium'],
  ['What does "Injury time" mean?', 'ماذا يعني "الوقت بدل الضائع"؟', 'Extra minutes added at end of half', 'دقائق إضافية تضاف في نهاية الشوط', 'Time when players rest', 'وقت راحة اللاعبين', 'Time between seasons', 'الوقت بين المواسم', 'Warm-up period', 'فترة الإحماء', 0, 'easy'],
  ['What is a "Golden Goal"?', 'ما هو "الهدف الذهبي"؟', 'First goal in extra time wins the match', 'الهدف الأول في الوقت الإضافي يفوز بالمباراة', 'Goal scored from midfield', 'هدف من منتصف الملعب', 'Goal in the final minute', 'هدف في الدقيقة الأخيرة', 'Goal that wins the league', 'هدف يفوز بالدوري', 0, 'medium'],
  ['What is "Gegenpressing"?', 'ما هو "الغيغنبريسينغ"؟', 'Counter-pressing immediately after losing the ball', 'الضغط مباشرة بعد فقدان الكرة', 'Pressing in opponent half', 'الضغط في نصف الخصم', 'Deep defending', 'دفاع عميق', 'Slow build-up play', 'بناء هجومي بطيء', 0, 'hard'],
  ['What is a "Panenka" penalty?', 'ما هي ركلة "البانينكا"؟', 'Chipped shot down the middle', 'تسديدة مقوسة في المنتصف', 'Hard shot to the corner', 'تسديدة قوية للزاوية', 'Pass instead of shot', 'تمرير بدلاً من التسديد', 'Goalkeeper takes the kick', 'حارس المرمى يسدد', 0, 'medium'],
];
for (const t of terms) {
  if (addQ('rules', t[0], t[1], [t[2], t[4], t[6], t[8]], [t[3], t[5], t[7], t[9]], t[10], t[11])) count++;
}

// Famous players by shirt number
const players2 = [
  ['Lionel Messi','10','ليونيل ميسي','Argentina','الأرجنتين'],
  ['Cristiano Ronaldo','7','كريستيانو رونالدو','Portugal','البرتغال'],
  ['Pelé','10','بيليه','Brazil','البرازيل'],
  ['Diego Maradona','10','دييغو مارادونا','Argentina','الأرجنتين'],
  ['Zinedine Zidane','10','زين الدين زيدان','France','فرنسا'],
  ['Neymar Jr','10','نيمار','Brazil','البرازيل'],
  ['Kylian Mbappé','7','كيليان مبابي','France','فرنسا'],
  ['Mohamed Salah','11','محمد صلاح','Egypt','مصر'],
  ['Kevin De Bruyne','17','كيفين دي بروين','Belgium','بلجيكا'],
  ['Karim Benzema','9','كريم بنزيما','France','فرنسا'],
  ['Robert Lewandowski','9','روبرت ليفاندوفسكي','Poland','بولندا'],
  ['Erling Haaland','9','إيرلينغ هالاند','Norway','النرويج'],
  ['Sergio Ramos','4','سيرخيو راموس','Spain','إسبانيا'],
  ['Andrés Iniesta','8','أندريس إنييستا','Spain','إسبانيا'],
  ['Xavi','6','تشافي','Spain','إسبانيا'],
  ['Manuel Neuer','1','مانويل نوير','Germany','ألمانيا'],
  ['Iker Casillas','1','إيكر كاسياس','Spain','إسبانيا'],
  ['Gianluigi Buffon','1','جيانلويجي بوفون','Italy','إيطاليا'],
  ['Luka Modrić','10','لوكا مودريتش','Croatia','كرواتيا'],
  ['Riyad Mahrez','7','رياض محرز','Algeria','الجزائر'],
  ['Sadio Mané','10','ساديو ماني','Senegal','السنغال'],
  ['Achraf Hakimi','2','أشرف حكيمي','Morocco','المغرب'],
  ['Hakim Ziyech','7','حكيم زياش','Morocco','المغرب'],
  ['Victor Osimhen','9','فيكتور أوسيمين','Nigeria','نيجيريا'],
];
for (const p of players2) {
  const pool = make4(p[0], p[2], players2.map(x => x[0]), players2.map(x => x[2]));
  if (addQ('player', `Which player wears the number ${p[1]} shirt?`, `أي لاعب يرتدي القميص رقم ${p[1]}؟`,
    pool.ans, pool.ansa, pool.correctIdx, 'medium',
    `${p[0]} wears #${p[1]}.`, `${p[2]} يرتدي رقم ${p[1]}.`)) count++;
  const pool2 = make4(p[0], p[2], players2.map(x => x[0]), players2.map(x => x[2]));
  if (addQ('player', `Which player plays for ${p[1]}?`, `أي لاعب يلعب لـ ${p[1]}？`,
    pool2.ans, pool2.ansa, pool2.correctIdx, 'easy',
    `${p[0]} plays for ${p[3]}.`, `${p[2]} يلعب لـ ${p[3]}.`)) count++;
}

// More WC records
const records = [
  ['Most World Cup goals in a single tournament', 'Just Fontaine (13 in 1958)', 'جوست فونتين (13 في 1958)', 'Ronaldo (8 in 2002)', 'رونالدو (8 في 2002)', 'Thomas Müller (5 in 2010)', 'توماس مولر (5 في 2010)', 'Mbappé (8 in 2022)', 'مبابي (8 في 2022)', 0, 'hard'],
  ['Most goals in a single World Cup match', '12 (Austria 7-5 Switzerland 1954)', '12 (النمسا 7-5 سويسرا 1954)', '10 (Hungary 10-1 El Salvador)', '10 (المجر 10-1 السلفادور)', '9 (Brazil 6-3 Poland)', '9 (البرازيل 6-3 بولندا)', '8 (Germany 8-0 Saudi Arabia)', '8 (ألمانيا 8-0 السعودية)', 0, 'hard'],
  ['Most World Cup clean sheets (goalkeeper)', 'Iker Casillas (8 in 2010)', 'إيكر كاسياس (8 في 2010)', 'Gianluigi Buffon (5 in 2006)', 'جيانلويجي بوفون (5 في 2006)', 'Manuel Neuer (4 in 2014)', 'مانويل نوير (4 في 2014)', 'Fabien Barthez (5 in 1998)', 'فابيان بارتيز (5 في 1998)', 0, 'hard'],
  ['Oldest player to score in a World Cup', 'Roger Milla (42 years, 1994)', 'روجر ميلا (42 عاماً، 1994)', 'Pelé (17 years, 1958)', 'بيليه (17 عاماً، 1958)', 'Miroslav Klose (36, 2014)', 'ميروسلاف كلوزه (36، 2014)', 'Lionel Messi (35, 2022)', 'ليونيل ميسي (35، 2022)', 0, 'hard'],
  ['Youngest player to play in a World Cup', 'Norman Whiteside (17 years, 1982)', 'نورمان وايتسايد (17 عاماً، 1982)', 'Pelé (17, 1958)', 'بيليه (17، 1958)', 'Mbappé (19, 2018)', 'مبابي (19، 2018)', 'Messi (18, 2006)', 'ميسي (18، 2006)', 0, 'medium'],
  ['Largest World Cup win margin', 'Hungary 9-0 South Korea (1954), Yugoslavia 9-0 Zaire (1974), Hungary 10-1 El Salvador (1982)', 'المجر 9-0 كوريا الجنوبية (1954)، يوغوسلافيا 9-0 زائير (1974)، المجر 10-1 السلفادور (1982)', 'Brazil 8-0 Sweden (1950)', 'البرازيل 8-0 السويد (1950)', 'Germany 8-0 Saudi Arabia (2002)', 'ألمانيا 8-0 السعودية (2002)', 'Portugal 7-0 North Korea (2010)', 'البرتغال 7-0 كوريا الشمالية (2010)', 0, 'hard'],
  ['Most consecutive World Cup wins', 'Brazil (11 matches, 1998-2006)', 'البرازيل (11 مباراة، 1998-2006)', 'Germany (7 matches)', 'ألمانيا (7 مباريات)', 'Argentina (6 matches)', 'الأرجنتين (6 مباريات)', 'France (5 matches)', 'فرنسا (5 مباريات)', 0, 'hard'],
  ['Most goals by a defender in World Cup history', 'Paolo Maldini (4 goals)', 'باولو مالديني (4 أهداف)', 'Sergio Ramos (3 goals)', 'سيرخيو راموس (3 أهداف)', 'Cafu (2 goals)', 'كافو (هدفان)', 'Roberto Carlos (1 goal)', 'روبرتو كارلوس (هدف)', 0, 'hard'],
  ['Fastest red card in World Cup history', 'José Batista (56 seconds, 1986)', 'خوسيه باتيستا (56 ثانية، 1986)', 'Zinedine Zidane (110 min, 2006)', 'زين الدين زيدان (110 د، 2006)', 'Rigobert Song (68 min, 1994)', 'ريغوبرت سونغ (68 د، 1994)', 'David Beckham (47 min, 1998)', 'ديفيد بيكهام (47 د، 1998)', 0, 'hard'],
  ['Most players from one club in a World Cup squad', 'Bayern Munich (8 in 2014)', 'بايرن ميونخ (8 في 2014)', 'Real Madrid (7 in 2022)', 'ريال مدريد (7 في 2022)', 'Barcelona (6 in 2010)', 'برشلونة (6 في 2010)', 'Manchester City (6 in 2022)', 'مانشستر سيتي (6 في 2022)', 0, 'hard'],
];
for (const r of records) {
  if (addQ('wch', `What is the record for: ${r[0]}?`, `ما هو الرقم القياسي لـ: ${r[0]}？`,
    [r[1], r[3], r[5], r[7]], [r[2], r[4], r[6], r[8]], r[9], r[10])) count++;
}

// More stadium questions
const stadiumsMore = [
  ['Azadi Stadium', 'Tehran, Iran (78,000)', 'ملعب آزادي', 'طهران، إيران (78,000)', 'Asia'],
  ['Bukit Jalil', 'Kuala Lumpur, Malaysia (87,000)', 'بوكيت جليل', 'كوالالمبور، ماليزيا (87,000)', 'Asia'],
  ['Gelora Bung Karno', 'Jakarta, Indonesia (77,000)', 'غلورا بونغ كارنو', 'جاكرتا، إندونيسيا (77,000)', 'Asia'],
  ['Narendra Modi Stadium', 'Ahmedabad, India (132,000)', 'ملعب ناريندرا مودي', 'أحمد آباد، الهند (132,000)', 'Asia/Cricket'],
  ['Rungrado 1st of May', 'Pyongyang, North Korea (114,000)', 'ملعب رونغرادو', 'بيونغيانغ، كوريا الشمالية (114,000)', 'Asia'],
  ['Estadio Monumental', 'Lima, Peru (80,000)', 'ملعب مونومنتال', 'ليما، بيرو (80,000)', 'South America'],
  ['Estadio Centenario', 'Montevideo, Uruguay (60,000)', 'ملعب سنتيناريو', 'مونتيفيديو، الأوروغواي (60,000)', 'South America'],
  ['La Bombonera', 'Buenos Aires, Argentina (54,000)', 'لا بومبونيرا', 'بوينس آيرس، الأرجنتين (54,000)', 'South America'],
  ['Estádio do Morumbi', 'São Paulo, Brazil (67,000)', 'ملعب دو مورومبي', 'ساو باولو، البرازيل (67,000)', 'South America'],
  ['Mineirão', 'Belo Horizonte, Brazil (62,000)', 'مينيراو', 'بيلو هوريزونتي، البرازيل (62,000)', 'South America'],
  ['Estádio Beira-Rio', 'Porto Alegre, Brazil (50,000)', 'ملعب بيرا ريو', 'بورتو أليغري، البرازيل (50,000)', 'South America'],
  ['Arena Corinthians', 'São Paulo, Brazil (49,000)', 'أرينا كورينثيانز', 'ساو باولو، البرازيل (49,000)', 'South America'],
  ['Emirates Stadium', 'London, England (60,704)', 'ملعب الإمارات', 'لندن، إنجلترا (60,704)', 'Europe'],
  ['Stamford Bridge', 'London, England (41,837)', 'ستامفورد بريدج', 'لندن، إنجلترا (41,837)', 'Europe'],
  ['Etihad Stadium', 'Manchester, England (53,000)', 'ملعب الاتحاد', 'مانشستر، إنجلترا (53,000)', 'Europe'],
  ['Tottenham Hotspur Stadium', 'London, England (62,850)', 'ملعب توتنهام', 'لندن، إنجلترا (62,850)', 'Europe'],
  ['Stade Vélodrome', 'Marseille, France (67,394)', 'ملعب فيلودروم', 'مارسيليا، فرنسا (67,394)', 'Europe'],
  ['Olympiastadion', 'Berlin, Germany (74,475)', 'الملعب الأولمبي', 'برلين، ألمانيا (74,475)', 'Europe'],
  ['Signal Iduna Park', 'Dortmund, Germany (81,365)', 'سيغنال إيدونا بارك', 'دورتموند، ألمانيا (81,365)', 'Europe'],
  ['Feijenoord Stadion (De Kuip)', 'Rotterdam, Netherlands (51,000)', 'ملعب فيينورد (دي كويب)', 'روتردام، هولندا (51,000)', 'Europe'],
  ['Estádio da Luz', 'Lisbon, Portugal (64,642)', 'ملعب النور', 'لشبونة، البرتغال (64,642)', 'Europe'],
  ['Estádio José Alvalade', 'Lisbon, Portugal (50,095)', 'ملعب جوزيه ألفالادي', 'لشبونة، البرتغال (50,095)', 'Europe'],
  ['Khalifa International Stadium', 'Doha, Qatar (45,000)', 'ملعب خليفة الدولي', 'الدوحة، قطر (45,000)', 'Asia'],
  ['Education City Stadium', 'Doha, Qatar (44,667)', 'ملعب المدينة التعليمية', 'الدوحة، قطر (44,667)', 'Asia'],
  ['Al Janoub Stadium', 'Al Wakrah, Qatar (44,325)', 'ملعب الجنوب', 'الوكرة، قطر (44,325)', 'Asia'],
];
for (let i = 0; i < stadiumsMore.length; i++) {
  const s = stadiumsMore[i];
  if (i < 12) {
    const pool = make4(s[0], s[2], stadiumsMore.map(x => x[0]), stadiumsMore.map(x => x[2]));
    if (addQ('stadium', `Which stadium is in ${s[1]?.split(',')[0] || s[1]}?`, `أي ملعب يقع في ${s[1]?.split('(')[0]?.trim() || s[1]}？`,
      pool.ans, pool.ansa, pool.correctIdx, 'medium', `${s[0]}: ${s[1]}`, `${s[2]}: ${s[3]}`)) count++;
  }
}

// More Arab team questions
const moreArab = [
  ['Which Arab team has qualified for the 2026 World Cup?', 'أي منتخب عربي تأهل لكأس العالم 2026؟', 'Morocco, Tunisia, Egypt, Algeria, Saudi Arabia, Jordan, Qatar', 'المغرب، تونس، مصر، الجزائر، السعودية، الأردن، قطر', 'Only Morocco and Saudi Arabia', 'فقط المغرب والسعودية', 'All Arab teams', 'جميع المنتخبات العربية', 'None', 'لا أحد', 0, 'hard'],
  ['Which Arab goalkeeper is known as the best in history?', 'من هو أفضل حارس مرمى عربي في التاريخ؟', 'Essam El-Hadary (Egypt)', 'عصام الحضري (مصر)', 'Nawaf Al-Aqidi (Saudi Arabia)', 'نواف العقيدي (السعودية)', 'Farouk Ben Mustapha (Tunisia)', 'فاروق بن مصطفى (تونس)', 'Bono (Morocco)', 'بونو (المغرب)', 0, 'medium'],
  ['How many World Cups have Egypt qualified for?', 'كم عدد كؤوس العالم التي تأهلت لها مصر؟', '3 (1934, 1990, 2018)', '3 (1934، 1990، 2018)', '2', '2', '4', '4', '1', '1', 0, 'medium'],
  ['Which Arab team has the best FIFA ranking?', 'أي منتخب عربي لديه أفضل تصنيف فيفا؟', 'Morocco (top 15)', 'المغرب (أفضل 15)', 'Tunisia (top 30)', 'تونس (أفضل 30)', 'Egypt (top 30)', 'مصر (أفضل 30)', 'Algeria (top 40)', 'الجزائر (أفضل 40)', 0, 'medium'],
  ['Who is Morocco\'s all-time top scorer?', 'من هو هداف المغرب التاريخي؟', 'Ahmed Faras (42 goals)', 'أحمد فرس (42 هدفاً)', 'Hakim Ziyech (22 goals)', 'حكيم زياش (22 هدفاً)', 'Mustapha Hadji (13 goals)', 'مصطفى حاجي (13 هدفاً)', 'Achraf Hakimi (9 goals)', 'أشرف حكيمي (9 أهداف)', 0, 'hard'],
  ['Who is Egypt\'s all-time top scorer?', 'من هو هداف مصر التاريخي؟', 'Hossam Hassan (68 goals)', 'حسام حسن (68 هدفاً)', 'Mohamed Salah (55 goals)', 'محمد صلاح (55 هدفاً)', 'Ahmed Hassan (33 goals)', 'أحمد حسن (33 هدفاً)', 'Mahmoud El Khatib (28 goals)', 'محمود الخطيب (28 هدفاً)', 0, 'medium'],
];
for (const q of moreArab) {
  if (addQ('arab', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11])) count++;
}

// More African questions
const moreAfrica = [
  ['Who is Senegal\'s all-time top scorer?', 'من هو هداف السنغال التاريخي؟', 'Sadio Mané (40+ goals)', 'ساديو ماني (40+ هدفاً)', 'El Hadji Diouf (22 goals)', 'الحاج ضيوف (22 هدفاً)', 'Henri Camara (19 goals)', 'هنري كمارا (19 هدفاً)', 'Mamadou Niang (18 goals)', 'مامادو نيانغ (18 هدفاً)', 0, 'medium'],
  ['Which African team has the best defensive record in WC?', 'أي منتخب أفريقي لديه أفضل سجل دفاعي في كأس العالم؟', 'Morocco (conceded 1 goal in 2022 WC)', 'المغرب (استقبل هدفاً واحداً في 2022)', 'Nigeria (2 goals in 1994)', 'نيجيريا (هدفان في 1994)', 'Cameroon (3 goals in 1990)', 'الكاميرون (3 أهداف في 1990)', 'Senegal (3 goals in 2002)', 'السنغال (3 أهداف في 2002)', 0, 'hard'],
  ['Which African nation has won the most AFCON titles?', 'أي دولة أفريقية فازت بأكبر عدد من ألقاب كأس أمم أفريقيا؟', 'Egypt (7)', 'مصر (7)', 'Cameroon (5)', 'الكاميرون (5)', 'Nigeria (3)', 'نيجيريا (3)', 'Algeria (2)', 'الجزائر (2)', 0, 'easy'],
  ['Who scored the most goals in AFCON history?', 'من سجل أكبر عدد من الأهداف في تاريخ كأس أمم أفريقيا؟', 'Samuel Eto\'o (18 goals)', 'صامويل إيتو (18 هدفاً)', 'Didier Drogba (11 goals)', 'ديدييه دروغبا (11 هدفاً)', 'Mohamed Salah (6 goals)', 'محمد صلاح (6 أهداف)', 'Asamoah Gyan (6 goals)', 'أسامواه جيان (6 أهداف)', 0, 'hard'],
];
for (const q of moreAfrica) {
  if (addQ('africa', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11])) count++;
}

// More Euro questions
const moreEuro = [
  ['Which European country has won the most EURO titles?', 'أي دولة أوروبية فازت بأكبر عدد من ألقاب اليورو؟', 'Spain (4)', 'إسبانيا (4)', 'Germany (3)', 'ألمانيا (3)', 'France (2)', 'فرنسا (2)', 'Italy (2)', 'إيطاليا (2)', 0, 'easy'],
  ['Which European club has the most UCL titles?', 'أي نادٍ أوروبي لديه أكبر عدد من ألقاب دوري الأبطال？', 'Real Madrid (15)', 'ريال مدريد (15)', 'AC Milan (7)', 'ميلان (7)', 'Bayern Munich (6)', 'بايرن ميونخ (6)', 'Liverpool (6)', 'ليفربول (6)', 0, 'easy'],
  ['Which European league is known as the Premier League?', 'أي دوري أوروبي يُعرف بالدوري الإنجليزي الممتاز؟', 'England', 'إنجلترا', 'Scotland', 'اسكتلندا', 'Spain', 'إسبانيا', 'Germany', 'ألمانيا', 0, 'easy'],
  ['What is the name of the European club competition?', 'ما اسم بطولة الأندية الأوروبية؟', 'UEFA Champions League', 'دوري أبطال أوروبا', 'Europa League', 'الدوري الأوروبي', 'European Cup', 'الكأس الأوروبية', 'Euro League', 'اليورو ليغ', 0, 'easy'],
];
for (const q of moreEuro) {
  if (addQ('euro', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11])) count++;
}

// More SA questions
const moreSA = [
  ['Who is Brazil\'s all-time top scorer?', 'من هو هداف البرازيل التاريخي؟', 'Neymar (79 goals)', 'نيمار (79 هدفاً)', 'Pelé (77 goals)', 'بيليه (77 هدفاً)', 'Ronaldo (62 goals)', 'رونالدو (62 هدفاً)', 'Romário (55 goals)', 'روماريو (55 هدفاً)', 0, 'medium'],
  ['How many times has Brazil won the World Cup?', 'كم مرة فازت البرازيل بكأس العالم؟', '5', '5', '4', '4', '3', '3', '2', '2', 0, 'easy'],
  ['Which Brazilian player has won 3 World Cups?', 'أي لاعب برازيلي فاز بـ 3 كؤوس عالم？', 'Pelé (1958, 1962, 1970)', 'بيليه (1958، 1962، 1970)', 'Ronaldo (1994, 2002)', 'رونالدو (1994، 2002)', 'Neymar (0)', 'نيمار (0)', 'Cafu (1994, 2002)', 'كافو (1994، 2002)', 0, 'easy'],
];
for (const q of moreSA) {
  if (addQ('sa', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11])) count++;
}

// More Asian questions
const moreAsia = [
  ['How many times has Japan won the AFC Asian Cup?', 'كم مرة فازت اليابان بكأس آسيا؟', '4 (1992, 2000, 2004, 2011)', '4 (1992، 2000، 2004، 2011)', '3', '3', '2', '2', '1', '1', 0, 'medium'],
  ['Which Australian player has scored the most WC goals?', 'أي لاعب أسترالي سجل أكبر عدد من الأهداف في كأس العالم？', 'Tim Cahill (5 goals)', 'تيم كاهيل (5 أهداف)', 'Mark Viduka (3 goals)', 'مارك فيدوكا (3 أهداف)', 'Harry Kewell (2 goals)', 'هاري كيويل (هدفان)', 'John Aloisi (2 goals)', 'جون ألويسي (هدفان)', 0, 'hard'],
  ['Which Asian team has the highest FIFA ranking?', 'أي منتخب آسيوي لديه أعلى تصنيف فيفا؟', 'Japan', 'اليابان', 'South Korea', 'كوريا الجنوبية', 'Australia', 'أستراليا', 'Iran', 'إيران', 0, 'medium'],
];
for (const q of moreAsia) {
  if (addQ('asia', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11])) count++;
}

// More Lebanese questions
const moreLeb = [
  ['Who is Lebanon\'s all-time top scorer?', 'من هو هداف لبنان التاريخي؟', 'Hassan Maatouk (23 goals)', 'حسن معتوق (23 هدفاً)', 'Roda Antar (20 goals)', 'رضا عنتر (20 هدفاً)', 'Vardan Ghazaryan (18 goals)', 'فاردان غازاريان (18 هدفاً)', 'Youssef Mohamad (16 goals)', 'يوسف محمد (16 هدفاً)', 0, 'medium'],
  ['Which club is based in Tripoli, Lebanon?', 'أي نادٍ مقره طرابلس، لبنان؟', 'Salam Zgharta', 'سلام زغرتا', 'Al-Ansar', 'الأنصار', 'Nejmeh', 'النجمة', 'Al-Ahed', 'العهد', 0, 'medium'],
  ['What is the capacity of Camille Chamoun Stadium?', 'ما هي سعة ملعب كميل شمعون؟', '~57,000', '~57,000', '~40,000', '~40,000', '~70,000', '~70,000', '~30,000', '~30,000', 0, 'hard'],
  ['Which year was Nejmeh SC founded?', 'في أي سنة تأسس نادي النجمة؟', '1945', '1945', '1933', '1933', '1951', '1951', '1966', '1966', 0, 'medium'],
  ['What is the winter break period in Lebanese football?', 'ما هي فترة العطلة الشتوية في كرة القدم اللبنانية؟', 'December to February', 'ديسمبر إلى فبراير', 'November to December', 'نوفمبر إلى ديسمبر', 'January only', 'يناير فقط', 'No winter break', 'لا توجد عطلة شتوية', 0, 'hard'],
];
for (const q of moreLeb) {
  if (addQ('lebanon', q[0], q[1], [q[2], q[4], q[6], q[8]], [q[3], q[5], q[7], q[9]], q[10], q[11])) count++;
}

// More flags
const flagsMore = [
  ['United Arab Emirates', 'Red, green, white, black horizontal', 'الإمارات العربية المتحدة', 'أحمر، أخضر، أبيض، أسود أفقي'],
  ['Kuwait', 'Green, white, red, black with trapezoid', 'الكويت', 'أخضر، أبيض، أحمر، أسود مع شبه منحرف'],
  ['Oman', 'Red, white, green horizontal with emblem', 'عُمان', 'أحمر، أبيض، أخضر أفقي مع شعار'],
  ['Bahrain', 'Red with white serrated edge', 'البحرين', 'أحمر مع حافة بيضاء مسننة'],
  ['Lebanon', 'Red, white, red horizontal with green cedar', 'لبنان', 'أحمر، أبيض، أحمر أفقي مع أرزة خضراء'],
  ['Syria', 'Red, white, black horizontal with two green stars', 'سوريا', 'أحمر، أبيض، أسود أفقي مع نجمتين أخضرتين'],
  ['Palestine', 'Black, white, green horizontal with red triangle', 'فلسطين', 'أسود، أبيض، أخضر أفقي مع مثلث أحمر'],
  ['Yemen', 'Red, white, black horizontal stripes', 'اليمن', 'أحمر، أبيض، أسود خطوط أفقية'],
  ['Norway', 'Red with blue and white cross', 'النرويج', 'أحمر مع صليب أزرق وأبيض'],
  ['Denmark', 'Red with white cross', 'الدنمارك', 'أحمر مع صليب أبيض'],
  ['Finland', 'White with blue cross', 'فنلندا', 'أبيض مع صليب أزرق'],
  ['Iceland', 'Blue with red and white cross', 'آيسلندا', 'أزرق مع صليب أحمر وأبيض'],
  ['Ireland', 'Green, white, orange vertical stripes', 'أيرلندا', 'أخضر، أبيض، برتقالي خطوط عمودية'],
  ['Greece', 'Blue and white stripes with white cross', 'اليونان', 'أزرق وأبيض خطوط مع صليب أبيض'],
  ['Poland', 'White on top, red on bottom horizontal', 'بولندا', 'أبيض فوق أحمر أفقي'],
  ['Russia', 'White, blue, red horizontal stripes', 'روسيا', 'أبيض، أزرق، أحمر خطوط أفقية'],
  ['Czech Republic', 'Blue triangle with white and red stripes', 'جمهورية التشيك', 'مثلث أزرق مع خطوط بيضاء وحمراء'],
  ['South Korea', 'White with red and blue circle', 'كوريا الجنوبية', 'أبيض مع دائرة حمراء وزرقاء'],
  ['North Korea', 'Blue, red, blue horizontal with white circle and red star', 'كوريا الشمالية', 'أزرق، أحمر، أزرق أفقي مع دائرة بيضاء ونجمة حمراء'],
  ['Saudi Arabia', 'Green with white inscription and sword', 'السعودية', 'أخضر مع كتابة بيضاء وسيف'],
];
for (let i = 0; i < flagsMore.length; i++) {
  const f = flagsMore[i];
  const pool = make4(f[0], f[2], flagsMore.map(x => x[0]), flagsMore.map(x => x[2]));
  if (addQ('flag', `Which flag is described as: "${f[1]}"?`, `أي علم يوصف بأنه: "${f[3]}"؟`,
    pool.ans, pool.ansa, pool.correctIdx, i < 10 ? 'medium' : 'hard', `Flag of ${f[0]}`, `علم ${f[2]}`)) count++;
}

// Generate INSERT SQL
let sql = '';
const rows = questions.map(q => {
  const catSql = catSqlMap[q.cat];
  return `(${catSql},\n  ${JSON.stringify(q.en)},\n  ${JSON.stringify(q.ar)},\n  ${JSON.stringify(q.ans)},\n  ${JSON.stringify(q.ansa)},\n  ${q.correct},\n  '${q.diff}',\n  ${JSON.stringify(q.exp)},\n  ${JSON.stringify(q.expa)},\n  true)`;
});
sql += 'INSERT INTO quiz_questions (category_id, question_en, question_ar, answers_en, answers_ar, correct_answer_index, difficulty, explanation_en, explanation_ar, active) VALUES\n';
sql += rows.join(',\n') + ';\n';

const outputPath = 'C:/Users/Dell/Desktop/quizgoal26/src/db/questions_more.sql';
fs.writeFileSync(outputPath, sql);
console.log('Added ' + questions.length + ' more unique questions -> ' + outputPath);

const stats = {};
for (const q of questions) {
  stats[q.cat] = (stats[q.cat] || 0) + 1;
}
console.log('\nPer category:');
for (const [cat, c] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${c}`);
}
