-- QuizGoal 2026 — Quiz Questions Seed
-- Run after schema, rls, rpc, seed.
-- Uses real category UUIDs from your database.

-- First, clear any existing questions
DELETE FROM quiz_battle_answers;
DELETE FROM quiz_questions;

-- Category UUIDs (from seed run)
-- To get yours: SELECT id, slug FROM quiz_categories;
-- If these IDs differ, run: SELECT id, slug FROM quiz_categories;
-- then replace the IDs below.

-- ============================================================
-- EASY QUESTIONS (20)
-- ============================================================

INSERT INTO quiz_questions (category_id, question_en, question_ar, answers_en, answers_ar, correct_answer_index, difficulty, explanation_en, explanation_ar, active)
VALUES
-- 1
((SELECT id FROM quiz_categories WHERE slug = 'wc2026-teams'),
 'Which country is hosting the 2026 FIFA World Cup?',
 'أي دولة تستضيف كأس العالم 2026؟',
 '["USA, Canada, Mexico","Qatar","Russia","Germany"]',
 '["الولايات المتحدة، كندا، المكسيك","قطر","روسيا","ألمانيا"]',
 0, 'easy',
 'The 2026 World Cup is jointly hosted by USA, Canada, and Mexico.',
 'كأس العالم 2026 تستضيفه الولايات المتحدة وكندا والمكسيك.',
 true),

-- 2
((SELECT id FROM quiz_categories WHERE slug = 'wc-history'),
 'Which country has won the most FIFA World Cup titles?',
 'أي دولة فازت بأكبر عدد من ألقاب كأس العالم؟',
 '["Germany","Argentina","Brazil","Italy"]',
 '["ألمانيا","الأرجنتين","البرازيل","إيطاليا"]',
 2, 'easy',
 'Brazil has won 5 World Cup titles (1958, 1962, 1970, 1994, 2002).',
 'البرازيل فازت بـ 5 ألقاب في كأس العالم.',
 true),

-- 3
((SELECT id FROM quiz_categories WHERE slug = 'guess-flag'),
 'Which country has a green, white, and red flag with an eagle in the center?',
 'أي دولة علمها أخضر وأبيض وأحمر مع نسر في الوسط؟',
 '["Egypt","Mexico","Italy","Syria"]',
 '["مصر","المكسيك","إيطاليا","سوريا"]',
 1, 'easy',
 'Mexico''s flag features green, white, and red stripes with an eagle eating a snake.',
 'علم المكسيك يضم خطوطاً خضراء وبيضاء وحمراء ونسراً يأكل أفعى.',
 true),

-- 4
((SELECT id FROM quiz_categories WHERE slug = 'guess-player'),
 'Which player is known as "The King of Football" and led Brazil to 3 World Cup wins?',
 'أي لاعب يُعرف بـ "ملك كرة القدم" وقاد البرازيل لـ 3 ألقاب في كأس العالم؟',
 '["Ronaldo","Pelé","Ronaldinho","Neymar"]',
 '["رونالدو","بيليه","رونالدينيو","نيمار"]',
 1, 'easy',
 'Pelé won the World Cup in 1958, 1962, and 1970.',
 'بيليه فاز بكأس العالم أعوام 1958 و1962 و1970.',
 true),

-- 5
((SELECT id FROM quiz_categories WHERE slug = 'stadiums'),
 'Which stadium is known as the "Home of Football" in England?',
 'أي ملعب يُعرف بـ "بيت كرة القدم" في إنجلترا؟',
 '["Old Trafford","Anfield","Wembley Stadium","Emirates Stadium"]',
 '["أولد ترافورد","آنفيلد","ملعب ويمبلي","ملعب الإمارات"]',
 2, 'easy',
 'Wembley Stadium is the national stadium of England.',
 'ملعب ويمبلي هو الملعب الوطني لإنجلترا.',
 true),

-- 6
((SELECT id FROM quiz_categories WHERE slug = 'arab-teams'),
 'Which Arab country reached the World Cup semi-finals in 2022?',
 'أي دولة عربية وصلت إلى نصف نهائي كأس العالم 2022؟',
 '["Saudi Arabia","Morocco","Egypt","Tunisia"]',
 '["السعودية","المغرب","مصر","تونس"]',
 1, 'easy',
 'Morocco made history by reaching the semi-finals of the 2022 World Cup.',
 'المغرب صنع التاريخ بوصوله إلى نصف نهائي كأس العالم 2022.',
 true),

-- 7
((SELECT id FROM quiz_categories WHERE slug = 'wc-history'),
 'In which year was the first FIFA World Cup held?',
 'في أي سنة أُقيم أول كأس عالم؟',
 '["1926","1930","1934","1950"]',
 '["1926","1930","1934","1950"]',
 1, 'easy',
 'The first World Cup was held in Uruguay in 1930.',
 'أقيم أول كأس عالم في الأوروغواي عام 1930.',
 true),

-- 8
((SELECT id FROM quiz_categories WHERE slug = 'stadiums'),
 'The Maracanã Stadium is located in which city?',
 'ملعب الماراكانا يقع في أي مدينة؟',
 '["São Paulo","Rio de Janeiro","Buenos Aires","Lisbon"]',
 '["ساو باولو","ريو دي جانيرو","بوينس آيرس","لشبونة"]',
 1, 'easy',
 'Maracanã is in Rio de Janeiro, Brazil.',
 'الماراكانا يقع في ريو دي جانيرو، البرازيل.',
 true),

-- 9
((SELECT id FROM quiz_categories WHERE slug = 'finals-history'),
 'Which two teams played the 2022 World Cup final?',
 'أي فريقين لعبا نهائي كأس العالم 2022؟',
 '["France vs Croatia","Argentina vs France","Brazil vs Germany","Spain vs Netherlands"]',
 '["فرنسا ضد كرواتيا","الأرجنتين ضد فرنسا","البرازيل ضد ألمانيا","إسبانيا ضد هولندا"]',
 1, 'easy',
 'Argentina defeated France on penalties in the 2022 final.',
 'الأرجنتين هزمت فرنسا بركلات الترجيح في نهائي 2022.',
 true),

-- 10
((SELECT id FROM quiz_categories WHERE slug = 'famous-goals'),
 'Who scored the "Hand of God" goal in 1986?',
 'من سجل هدف "يد الله" في 1986؟',
 '["Maradona","Messi","Pelé","Zidane"]',
 '["مارادونا","ميسي","بيليه","زيدان"]',
 0, 'easy',
 'Diego Maradona scored the famous Hand of God goal against England in 1986.',
 'دييغو مارادونا سجل هدف يد الله الشهير ضد إنجلترا في 1986.',
 true),

-- 11
((SELECT id FROM quiz_categories WHERE slug = 'captains-legends'),
 'Who captained Argentina to victory in the 2022 World Cup?',
 'من قاد الأرجنتين للفوز بكأس العالم 2022؟',
 '["Angel Di Maria","Lionel Messi","Emiliano Martinez","Julian Alvarez"]',
 '["أنخيل دي ماريا","ليونيل ميسي","إيميليانو مارتينيز","خوليان ألفاريز"]',
 1, 'easy',
 'Lionel Messi captained Argentina to their 2022 World Cup triumph.',
 'ليونيل ميسي قاد الأرجنتين للفوز بكأس العالم 2022.',
 true),

-- 12
((SELECT id FROM quiz_categories WHERE slug = 'lebanese-fan-culture'),
 'What is the most popular sport in Lebanon?',
 'ما هي الرياضة الأكثر شعبية في لبنان؟',
 '["Basketball","Football","Tennis","Swimming"]',
 '["كرة السلة","كرة القدم","التنس","السباحة"]',
 1, 'easy',
 'Football is the most popular sport in Lebanon.',
 'كرة القدم هي الرياضة الأكثر شعبية في لبنان.',
 true),

-- 13
((SELECT id FROM quiz_categories WHERE slug = 'wc2026-teams'),
 'How many teams are participating in the 2026 World Cup?',
 'كم عدد المنتخبات المشاركة في كأس العالم 2026؟',
 '["32","48","64","24"]',
 '["32","48","64","24"]',
 1, 'easy',
 'The 2026 World Cup features 48 teams across 12 groups.',
 'كأس العالم 2026 يضم 48 منتخباً في 12 مجموعة.',
 true),

-- 14
((SELECT id FROM quiz_categories WHERE slug = 'african-teams'),
 'Which African country will host the 2030 World Cup?',
 'أي دولة أفريقية ستستضيف كأس العالم 2030؟',
 '["South Africa","Morocco","Egypt","Nigeria"]',
 '["جنوب أفريقيا","المغرب","مصر","نيجيريا"]',
 1, 'easy',
 'Morocco will co-host the 2030 World Cup with Spain and Portugal.',
 'المغرب ستستضيف كأس العالم 2030 مع إسبانيا والبرتغال.',
 true),

-- 15
((SELECT id FROM quiz_categories WHERE slug = 'asian-teams'),
 'Which Asian country has qualified for the most World Cups?',
 'أي دولة آسيوية تأهلت لأكبر عدد من كؤوس العالم؟',
 '["Japan","South Korea","Saudi Arabia","Iran"]',
 '["اليابان","كوريا الجنوبية","السعودية","إيران"]',
 2, 'easy',
 'South Korea has qualified for 11 World Cups, the most among Asian nations.',
 'كوريا الجنوبية تأهلت لـ 11 كأس عالم، الأكثر بين الدول الآسيوية.',
 true),

-- 16
((SELECT id FROM quiz_categories WHERE slug = 'european-teams'),
 'Which European country has won the most European Championships?',
 'أي دولة أوروبية فازت بأكبر عدد من بطولات أمم أوروبا؟',
 '["Germany","Spain","France","Italy"]',
 '["ألمانيا","إسبانيا","فرنسا","إيطاليا"]',
 1, 'easy',
 'Spain has won 4 European Championships, the most of any nation.',
 'إسبانيا فازت بـ 4 بطولات أمم أوروبا، الأكثر بين أي دولة.',
 true),

-- 17
((SELECT id FROM quiz_categories WHERE slug = 'south-american-teams'),
 'Which South American team has won the most Copa América titles?',
 'أي منتخب من أمريكا الجنوبية فاز بأكبر عدد من بطولات كوبا أمريكا؟',
 '["Brazil","Argentina","Uruguay","Chile"]',
 '["البرازيل","الأرجنتين","الأوروغواي","تشيلي"]',
 2, 'easy',
 'Uruguay has won 15 Copa América titles, the most of any nation.',
 'الأوروغواي فازت بـ 15 بطولة كوبا أمريكا، الأكثر بين أي دولة.',
 true),

-- 18
((SELECT id FROM quiz_categories WHERE slug = 'lebanese-fan-culture'),
 'Which Lebanese club has won the most Lebanese Premier League titles?',
 'أي نادٍ لبناني فاز بأكبر عدد من ألقاب الدوري اللبناني؟',
 '["Al-Ahed","Nejmeh","Al-Ansar","Racing Beirut"]',
 '["العهد","النجمة","الأنصار","الراسينغ"]',
 2, 'easy',
 'Al-Ansar has won the most Lebanese Premier League titles (14).',
 'الأنصار فاز بأكبر عدد من ألقاب الدوري اللبناني (14).',
 true),

-- 19
((SELECT id FROM quiz_categories WHERE slug = 'football-rules'),
 'How long is a standard football match?',
 'كم تبلغ مدة مباراة كرة قدم عادية؟',
 '["80 minutes","90 minutes","100 minutes","120 minutes"]',
 '["80 دقيقة","90 دقيقة","100 دقيقة","120 دقيقة"]',
 1, 'easy',
 'A standard match is 90 minutes: two 45-minute halves.',
 'المباراة العادية 90 دقيقة: شوطان مدة كل منهما 45 دقيقة.',
 true),

-- 20
((SELECT id FROM quiz_categories WHERE slug = 'guess-flag'),
 'Which country has a red flag with a white diagonal cross?',
 'أي دولة علمها أحمر مع صليب أبيض قطري؟',
 '["Switzerland","Denmark","England","Norway"]',
 '["سويسرا","الدنمارك","إنجلترا","النرويج"]',
 2, 'easy',
 'England''s flag is a red cross on a white background (St George''s Cross).',
 'علم إنجلترا هو صليب أحمر على خلفية بيضاء (صليب القديس جورج).',
 true);

-- ============================================================
-- MEDIUM QUESTIONS (18)
-- ============================================================

INSERT INTO quiz_questions (category_id, question_en, question_ar, answers_en, answers_ar, correct_answer_index, difficulty, explanation_en, explanation_ar, active)
VALUES
-- 21
((SELECT id FROM quiz_categories WHERE slug = 'wc2026-teams'),
 'Which team is in Group C of the 2026 World Cup alongside Brazil?',
 'أي منتخب في المجموعة C في كأس العالم 2026 إلى جانب البرازيل؟',
 '["Morocco","Spain","Germany","England"]',
 '["المغرب","إسبانيا","ألمانيا","إنجلترا"]',
 0, 'medium',
 'Group C: Brazil, Morocco, Haiti, Scotland.',
 'المجموعة C: البرازيل، المغرب، هايتي، اسكتلندا.',
 true),

-- 22
((SELECT id FROM quiz_categories WHERE slug = 'guess-player'),
 'Who holds the record for most goals in World Cup history?',
 'من يحمل الرقم القياسي لأكبر عدد من الأهداف في تاريخ كأس العالم؟',
 '["Ronaldo (Brazil)","Miroslav Klose","Marta","Just Fontaine"]',
 '["رونالدو (البرازيل)","ميروسلاف كلوزه","مارتا","جوست فونتين"]',
 1, 'medium',
 'Miroslav Klose scored 16 goals across 4 World Cups.',
 'ميروسلاف كلوزه سجل 16 هدفاً في 4 نسخ من كأس العالم.',
 true),

-- 23
((SELECT id FROM quiz_categories WHERE slug = 'asian-teams'),
 'Which Asian country finished 4th in the 2002 World Cup?',
 'أي دولة آسيوية حلت في المركز الرابع في كأس العالم 2002؟',
 '["Japan","South Korea","Saudi Arabia","Iran"]',
 '["اليابان","كوريا الجنوبية","السعودية","إيران"]',
 1, 'medium',
 'South Korea finished 4th in the 2002 World Cup they co-hosted.',
 'كوريا الجنوبية حلت رابعاً في كأس العالم 2002 الذي استضافته.',
 true),

-- 24
((SELECT id FROM quiz_categories WHERE slug = 'lebanese-fan-culture'),
 'Which Lebanese football club is based in Beirut and wears yellow?',
 'أي نادي كرة قدم لبناني مقره بيروت ويرتدي الأصفر؟',
 '["Al-Ansar","Nejmeh SC","Al-Ahed","Racing Beirut"]',
 '["الأنصار","النجمة","العهد","الراسينغ"]',
 1, 'medium',
 'Nejmeh SC, based in Beirut, wears yellow and is one of Lebanon''s most popular clubs.',
 'نادي النجمة الرياضي مقره بيروت ويرتدي الأصفر.',
 true),

-- 25
((SELECT id FROM quiz_categories WHERE slug = 'african-teams'),
 'Which African team was the first to reach the World Cup quarter-finals?',
 'أي منتخب أفريقي كان أول من وصل إلى ربع نهائي كأس العالم؟',
 '["Nigeria","Senegal","Cameroon","Ghana"]',
 '["نيجيريا","السنغال","الكاميرون","غانا"]',
 2, 'medium',
 'Cameroon reached the quarter-finals in 1990.',
 'الكاميرون وصلت إلى ربع النهائي في 1990.',
 true),

-- 26
((SELECT id FROM quiz_categories WHERE slug = 'football-rules'),
 'How many substitutions are allowed in a World Cup match?',
 'كم عدد التبديلات المسموح بها في مباراة كأس العالم؟',
 '["3","4","5","6"]',
 '["3","4","5","6"]',
 2, 'medium',
 'Teams can make up to 5 substitutions in a World Cup match.',
 'يمكن للفرق إجراء ما يصل إلى 5 تبديلات في مباراة كأس العالم.',
 true),

-- 27
((SELECT id FROM quiz_categories WHERE slug = 'penalty-drama'),
 'Which team won the 1994 World Cup on penalties?',
 'أي فريق فاز بكأس العالم 1994 بركلات الترجيح؟',
 '["Italy","Brazil","Germany","Argentina"]',
 '["إيطاليا","البرازيل","ألمانيا","الأرجنتين"]',
 1, 'medium',
 'Brazil beat Italy on penalties in the 1994 final.',
 'البرازيل هزمت إيطاليا بركلات الترجيح في نهائي 1994.',
 true),

-- 28
((SELECT id FROM quiz_categories WHERE slug = 'south-american-teams'),
 'How many World Cups has Argentina won?',
 'كم عدد كؤوس العالم التي فازت بها الأرجنتين؟',
 '["2","3","4","1"]',
 '["2","3","4","1"]',
 1, 'medium',
 'Argentina has won 3 World Cups: 1978, 1986, and 2022.',
 'الأرجنتين فازت بـ 3 كؤوس عالم: 1978 و1986 و2022.',
 true),

-- 29
((SELECT id FROM quiz_categories WHERE slug = 'wc2026-teams'),
 'Which team is in Group L of the 2026 World Cup?',
 'أي منتخب في المجموعة L من كأس العالم 2026؟',
 '["England, Croatia, Ghana, Panama","France, Senegal, Iraq, Norway","Portugal, Colombia, Uzbekistan, Congo DR","Spain, Cabo Verde, Saudi Arabia, Uruguay"]',
 '["إنجلترا، كرواتيا، غانا، بنما","فرنسا، السنغال، العراق، النرويج","البرتغال، كولومبيا، أوزبكستان، الكونغو الديمقراطية","إسبانيا، كابو فيردي، السعودية، الأوروغواي"]',
 0, 'medium',
 'Group L: England, Croatia, Ghana, Panama.',
 'المجموعة L: إنجلترا، كرواتيا، غانا، بنما.',
 true),

-- 30
((SELECT id FROM quiz_categories WHERE slug = 'wc-history'),
 'Who won the Golden Ball in the 2014 World Cup?',
 'من فاز بالكرة الذهبية في كأس العالم 2014؟',
 '["Thomas Müller","Lionel Messi","James Rodríguez","Manuel Neuer"]',
 '["توماس مولر","ليونيل ميسي","جيمس رودريغيز","مانويل نوير"]',
 1, 'medium',
 'Lionel Messi won the Golden Ball in 2014.',
 'ليونيل ميسي فاز بالكرة الذهبية في 2014.',
 true),

-- 31
((SELECT id FROM quiz_categories WHERE slug = 'stadiums'),
 'What is the capacity of Camp Nou stadium?',
 'ما هي سعة ملعب كامب نو؟',
 '["~75,000","~99,000","~85,000","~65,000"]',
 '["~75,000","~99,000","~85,000","~65,000"]',
 1, 'medium',
 'Camp Nou in Barcelona has a capacity of approximately 99,354.',
 'ملعب كامب نو في برشلونة يتسع لحوالي 99,354 متفرجاً.',
 true),

-- 32
((SELECT id FROM quiz_categories WHERE slug = 'european-teams'),
 'Which country won the 2016 UEFA European Championship?',
 'أي دولة فازت ببطولة أمم أوروبا 2016؟',
 '["France","Portugal","Germany","Spain"]',
 '["فرنسا","البرتغال","ألمانيا","إسبانيا"]',
 1, 'medium',
 'Portugal beat France in the 2016 Euro final.',
 'البرتغال هزمت فرنسا في نهائي يورو 2016.',
 true),

-- 33
((SELECT id FROM quiz_categories WHERE slug = 'captains-legends'),
 'Who was the first player to score in 5 different World Cup tournaments?',
 'من هو أول لاعب يسجل في 5 نسخ مختلفة من كأس العالم؟',
 '["Pelé","Miroslav Klose","Lionel Messi","Cristiano Ronaldo"]',
 '["بيليه","ميروسلاف كلوزه","ليونيل ميسي","كريستيانو رونالدو"]',
 2, 'medium',
 'Lionel Messi scored in 2006, 2014, 2018, 2022, and 2026 World Cups.',
 'ليونيل ميسي سجل في كؤوس العالم 2006 و2014 و2018 و2022 و2026.',
 true),

-- 34
((SELECT id FROM quiz_categories WHERE slug = 'famous-goals'),
 'Who scored the bicycle kick goal for Manchester United vs Aston Villa in 2011?',
 'من سجل هدف المقصية لمانشستر يونايتد ضد أستون فيلا في 2011؟',
 '["Wayne Rooney","Cristiano Ronaldo","Robin van Persie","Zlatan Ibrahimovic"]',
 '["واين روني","كريستيانو رونالدو","روبين فان بيرسي","زلاتان إبراهيموفيتش"]',
 0, 'medium',
 'Wayne Rooney scored a famous bicycle kick winner against Aston Villa in 2011.',
 'واين روني سجل هدف مقصية شهير ضد أستون فيلا في 2011.',
 true),

-- 35
((SELECT id FROM quiz_categories WHERE slug = 'arab-teams'),
 'Which Arab team has won the AFC Asian Cup the most times?',
 'أي منتخب عربي فاز بكأس آسيا لأكبر عدد من المرات؟',
 '["Saudi Arabia","Qatar","Iraq","Kuwait"]',
 '["السعودية","قطر","العراق","الكويت"]',
 0, 'medium',
 'Saudi Arabia has won the AFC Asian Cup 4 times.',
 'السعودية فازت بكأس آسيا 4 مرات.',
 true),

-- 36
((SELECT id FROM quiz_categories WHERE slug = 'guess-flag'),
 'Which country has a flag with a crescent and star?',
 'أي دولة علمها يحتوي على هلال ونجمة؟',
 '["Turkey","Pakistan","Algeria","All of the above"]',
 '["تركيا","باكستان","الجزائر","جميع ما ذكر"]',
 3, 'medium',
 'Turkey, Pakistan, and Algeria all feature a crescent and star on their flags.',
 'تركيا وباكستان والجزائر جميعها تحتوي أعلامها على هلال ونجمة.',
 true),

-- 37
((SELECT id FROM quiz_categories WHERE slug = 'finals-history'),
 'Which world cup final went to the first-ever penalty shootout in a final?',
 'أي نهائي كأس عالم شهد أول ركلات ترجيح في تاريخ النهائيات؟',
 '["1994 Brazil vs Italy","2006 Italy vs France","2022 Argentina vs France","1978 Argentina vs Netherlands"]',
 '["1994 البرازيل ضد إيطاليا","2006 إيطاليا ضد فرنسا","2022 الأرجنتين ضد فرنسا","1978 الأرجنتين ضد هولندا"]',
 0, 'medium',
 'The 1994 final between Brazil and Italy was the first decided by penalties.',
 'نهائي 1994 بين البرازيل وإيطاليا كان أول نهائي يحسم بركلات الترجيح.',
 true),

-- 38
((SELECT id FROM quiz_categories WHERE slug = 'penalty-drama'),
 'Which World Cup final had the most penalty kicks in its history?',
 'أي نهائي كأس عالم شهد أكبر عدد من ركلات الترجيح في تاريخه؟',
 '["1994","2022","2006","2014"]',
 '["1994","2022","2006","2014"]',
 1, 'medium',
 'The 2022 final between Argentina and France had 3 penalties awarded during the match.',
 'نهائي 2022 بين الأرجنتين وفرنسا شهد 3 ركلات جزاء خلال المباراة.',
 true);

-- ============================================================
-- HARD QUESTIONS (12)
-- ============================================================

INSERT INTO quiz_questions (category_id, question_en, question_ar, answers_en, answers_ar, correct_answer_index, difficulty, explanation_en, explanation_ar, active)
VALUES
-- 39
((SELECT id FROM quiz_categories WHERE slug = 'european-teams'),
 'Which European country has never missed a World Cup tournament?',
 'أي دولة أوروبية لم تتغيب عن أي بطولة كأس عالم؟',
 '["England","Germany","Italy","Spain"]',
 '["إنجلترا","ألمانيا","إيطاليا","إسبانيا"]',
 1, 'hard',
 'Germany has participated in every World Cup since 1930.',
 'ألمانيا شاركت في كل نسخ كأس العالم منذ 1930.',
 true),

-- 40
((SELECT id FROM quiz_categories WHERE slug = 'wc2026-teams'),
 'Which team is in Group J alongside Argentina?',
 'أي منتخب في المجموعة J إلى جانب الأرجنتين؟',
 '["Brazil, Portugal, France","Algeria, Austria, Jordan","England, Croatia, Ghana","Spain, Germany, Italy"]',
 '["البرازيل، البرتغال، فرنسا","الجزائر، النمسا، الأردن","إنجلترا، كرواتيا، غانا","إسبانيا، ألمانيا، إيطاليا"]',
 1, 'hard',
 'Group J: Argentina, Algeria, Austria, Jordan.',
 'المجموعة J: الأرجنتين، الجزائر، النمسا، الأردن.',
 true),

-- 41
((SELECT id FROM quiz_categories WHERE slug = 'wc2026-teams'),
 'Which African teams are participating in the 2026 World Cup?',
 'ما هي المنتخبات الأفريقية المشاركة في كأس العالم 2026؟',
 '["South Africa, Morocco, Tunisia, Egypt, Senegal, Côte d''Ivoire, Algeria, Ghana","Nigeria, Cameroon, Ghana, Egypt","Morocco, Senegal, Algeria, Tunisia","South Africa, Egypt, Morocco, Algeria"]',
 '["جنوب أفريقيا، المغرب، تونس، مصر، السنغال، ساحل العاج، الجزائر، غانا","نيجيريا، الكاميرون، غانا، مصر","المغرب، السنغال، الجزائر، تونس","جنوب أفريقيا، مصر، المغرب، الجزائر"]',
 0, 'hard',
 '8 African teams qualified: South Africa, Morocco, Tunisia, Egypt, Senegal, Côte d''Ivoire, Algeria, Ghana.',
 '8 منتخبات أفريقية تأهلت: جنوب أفريقيا، المغرب، تونس، مصر، السنغال، ساحل العاج، الجزائر، غانا.',
 true),

-- 42
((SELECT id FROM quiz_categories WHERE slug = 'wc-history'),
 'Which country has the best win percentage in World Cup history?',
 'أي دولة لديها أعلى نسبة فوز في تاريخ كأس العالم؟',
 '["Brazil","Germany","Argentina","Italy"]',
 '["البرازيل","ألمانيا","الأرجنتين","إيطاليا"]',
 2, 'hard',
 'Argentina has the best win percentage in World Cup history (minimum 50 matches).',
 'الأرجنتين لديها أعلى نسبة فوز في تاريخ كأس العالم (بحد أدنى 50 مباراة).',
 true),

-- 43
((SELECT id FROM quiz_categories WHERE slug = 'captains-legends'),
 'Which player has the most World Cup appearances (matches played)?',
 'أي لاعب لديه أكبر عدد من المشاركات في كأس العالم (مباريات لعبها)؟',
 '["Lionel Messi","Miroslav Klose","Cristiano Ronaldo","Paolo Maldini"]',
 '["ليونيل ميسي","ميروسلاف كلوزه","كريستيانو رونالدو","باولو مالديني"]',
 2, 'hard',
 'Cristiano Ronaldo has the most World Cup appearances with over 2.5 billion viewers.',
 'كريستيانو رونالدو لديه أكبر عدد من المشاركات في كأس العالم.',
 true),

-- 44
((SELECT id FROM quiz_categories WHERE slug = 'guess-player'),
 'Which player scored the fastest goal in World Cup history?',
 'أي لاعب سجل أسرع هدف في تاريخ كأس العالم؟',
 '["Hakan Şükür","Clint Dempsey","Robben","David Villa"]',
 '["هاكان شوكور","كلينت ديمبسي","روبن","دافيد فيا"]',
 0, 'hard',
 'Hakan Şükür scored after 11 seconds for Turkey vs South Korea in 2002.',
 'هاكان شوكور سجل بعد 11 ثانية لتركيا ضد كوريا الجنوبية في 2002.',
 true),

-- 45
((SELECT id FROM quiz_categories WHERE slug = 'stadiums'),
 'Which stadium hosted the 1950 World Cup final (the "Maracanazo")?',
 'أي ملعب استضاف نهائي كأس العالم 1950 ("الماراكانازو")؟',
 '["Maracanã","Estádio do Morumbi","Pacaembu","Mineirão"]',
 '["الماراكانا","ملعب دو مورومبي","باكايمبو","مينيراو"]',
 0, 'hard',
 'The Maracanã hosted the 1950 final where Uruguay beat Brazil.',
 'الماراكانا استضاف نهائي 1950 حيث هزمت الأوروغواي البرازيل.',
 true),

-- 46
((SELECT id FROM quiz_categories WHERE slug = 'african-teams'),
 'Which African team reached the World Cup quarter-finals in 2010?',
 'أي منتخب أفريقي وصل إلى ربع نهائي كأس العالم 2010؟',
 '["Nigeria","Ghana","Senegal","Algeria"]',
 '["نيجيريا","غانا","السنغال","الجزائر"]',
 1, 'hard',
 'Ghana reached the quarter-finals in 2010, losing to Uruguay on penalties.',
 'غانا وصلت إلى ربع النهائي في 2010 وخسرت أمام الأوروغواي بركلات الترجيح.',
 true),

-- 47
((SELECT id FROM quiz_categories WHERE slug = 'guess-flag'),
 'Which is the only country with a non-rectangular national flag?',
 'ما هي الدولة الوحيدة التي علمها غير مستطيل؟',
 '["Switzerland","Nepal","Vatican City","Qatar"]',
 '["سويسرا","نيبال","الفاتيكان","قطر"]',
 1, 'hard',
 'Nepal has the only non-rectangular national flag in the world (two triangular shapes).',
 'نيبال لديها العلم الوحيد غير المستطيل في العالم (شكلان مثلثان).',
 true),

-- 48
((SELECT id FROM quiz_categories WHERE slug = 'lebanese-fan-culture'),
 'In which year did Lebanon qualify for the AFC Asian Cup for the first time?',
 'في أي سنة تأهل لبنان لكأس آسيا لأول مرة؟',
 '["1996","2000","2004","2010"]',
 '["1996","2000","2004","2010"]',
 1, 'hard',
 'Lebanon qualified for the AFC Asian Cup for the first time as hosts in 2000.',
 'لبنان تأهل لكأس آسيا لأول مرة كمستضيف في 2000.',
 true),

-- 49
((SELECT id FROM quiz_categories WHERE slug = 'south-american-teams'),
 'Which South American team has never missed a single World Cup edition?',
 'أي منتخب من أمريكا الجنوبية لم يتغيب عن أي نسخة من كأس العالم؟',
 '["Argentina","Brazil","Uruguay","Chile"]',
 '["الأرجنتين","البرازيل","الأوروغواي","تشيلي"]',
 1, 'hard',
 'Brazil is the only South American country to have played in every World Cup.',
 'البرازيل هي الدولة الوحيدة في أمريكا الجنوبية التي شاركت في كل نسخ كأس العالم.',
 true),

-- 50
((SELECT id FROM quiz_categories WHERE slug = 'football-rules'),
 'When was the back-pass rule introduced in football?',
 'متى تم تطبيق قاعدة إعادة تمرير حارس المرمى في كرة القدم؟',
 '["1986","1992","1998","2002"]',
 '["1986","1992","1998","2002"]',
 1, 'hard',
 'The back-pass rule was introduced in 1992 to prevent time-wasting.',
 'قاعدة إعادة تمرير حارس المرمى تم تطبيقها في 1992 لمنع إضاعة الوقت.',
 true);
