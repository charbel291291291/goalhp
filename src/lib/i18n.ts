import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      app: { name: 'QuizGoal 2026', by: 'by eyedeaz', tagline: 'Battle. Predict. Share. Win.' },
      nav: { home: 'Home', arena: 'Arena', schedule: 'Schedule', battle: 'Battle', predict: 'Predict', poster: 'Poster', rewards: 'Rewards', profile: 'Profile', leaderboards: 'Leaderboards', sponsors: 'Sponsors', friends: 'Friends', fanCup: 'Fan Cup', city: 'City League', cafe: 'Café Zone' },
      cta: { start: 'Start Playing', createPoster: 'Create Fan Poster', viewRewards: 'View Rewards' },
      home: { nextMatch: 'Next Match', dailyMission: 'Daily Mission', featured: 'Featured Battle', teamWar: 'Team War', yourRank: 'Your Rank', totalPoints: 'Total Points', level: 'Level' },
      battle: { solo: 'Solo Sprint', pvp: '1v1 Battle', friend: 'Friend Challenge', daily: 'Daily Challenge', teamWar: 'Team War Quiz', quickCorrect: 'Quick correct answers earn more points!', streak: 'Streak Bonus!', perfect: 'Perfect Battle!', win: 'Winner!', lose: 'Good effort!', results: 'Battle Results', share: 'Share Result', searching: 'Searching for opponent...', matchmaking: 'Matchmaking in progress', cancel: 'Cancel', playAgain: 'Play Again', back: 'Back', findOpponent: 'Find Opponent', draw: 'Draw!' },
      predict: { title: 'Predictions', matchWinner: 'Match Winner', exactScore: 'Exact Score', firstGoal: 'First Goal Team', totalGoals: 'Total Goals Range', cleanSheet: 'Clean Sheet', playerMatch: 'Player of the Match', groupWinner: 'Group Winner', tournamentWinner: 'Tournament Winner', lockAt: 'Locks at', points: 'pts', disclaimer: 'This is a free prediction game. No deposits. No wagers. No cash-out. Points are for rewards and discounts only.' },
      poster: { title: 'Fan Poster Generator', upload: 'Upload Photo', selectTeam: 'Select Team', selectStyle: 'Select Style', slogan: 'Write Slogan', generate: 'Generate Poster', download: 'Download', share: 'Share', gallery: 'Poster Gallery', vote: 'Vote', report: 'Report' },
      rewards: { title: 'Rewards Marketplace', redeem: 'Redeem', points: 'Points', quantity: 'Available', expires: 'Expires', terms: 'Terms', code: 'Redemption Code', scanned: 'Show this code to the sponsor' },
      leaderboard: { global: 'Global', daily: 'Daily', weekly: 'Weekly', team: 'Team', region: 'Region', friends: 'Friends', rank: 'Rank', player: 'Player', points: 'Points' },
      teamwar: { title: 'Team War', ranking: 'Team Rankings', yourTeam: 'Your Team', needs: 'needs', toPass: 'points to pass' },
      street: { title: 'Street League Lebanon', representing: 'I am representing', on: 'on QuizGoal 2026' },
      missions: { title: 'Daily Missions', play: 'Play 3 quiz battles', win: 'Win 1 battle', predict: 'Make 2 predictions', create: 'Create 1 fan poster', vote: 'Vote on 5 posters', share: 'Share 1 result', invite: 'Invite 1 friend', progress: 'Progress', completed: 'Completed!' },
      profile: { title: 'My Profile', edit: 'Edit Profile', settings: 'Settings', language: 'Language', referrals: 'Referrals', logout: 'Logout', memberSince: 'Member since', notifications: 'Notifications', matchReminders: 'Match Reminders', predictionResults: 'Prediction Results', pushPermission: 'Allow push notifications to get match reminders and prediction results', pushEnabled: 'Push notifications enabled', pushDisabled: 'Push notifications disabled', enable: 'Enable', disable: 'Disable' },
      auth: { login: 'Login', signup: 'Sign Up', email: 'Email', password: 'Password', username: 'Username', magicLink: 'Magic Link', or: 'or continue with' },
      onboarding: { title: 'Welcome to QuizGoal 2026!', subtitle: 'Set up your profile to get started', pickTeam: 'Pick Your Favorite Team', pickCountry: 'Pick Your Country', pickRegion: 'Pick Your Region (Lebanon)', pickLanguage: 'Preferred Language', acceptRules: 'I understand this is a free prediction game. No gambling. No cash-out. Points have no monetary value.', start: 'Start Playing!' },
      friends: { title: 'Friends', challenge: 'Challenge', incomingChallenge: 'challenged you!', accept: 'Accept', decline: 'Decline', noFriends: 'No friends yet', pending: 'Pending', add: 'Add', requestSent: 'Friend request sent', requestAccepted: 'Friend request accepted' },
      sponsor: { title: 'Our Sponsors', offers: 'Offers', contact: 'Contact', sponsored: 'Sponsored Challenge' },
      admin: { overview: 'Overview', users: 'Users', questions: 'Questions', categories: 'Categories', teams: 'Teams', matches: 'Matches', predictions: 'Predictions', posters: 'Posters', sponsors: 'Sponsors', rewards: 'Rewards', redemptions: 'Redemptions', missions: 'Missions', sponsorPayments: 'Sponsor Payments', settings: 'Settings' },
      common: { loading: 'Loading...', error: 'Something went wrong', retry: 'Retry', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', create: 'Create', search: 'Search', filter: 'Filter', back: 'Back', next: 'Next', done: 'Done', points: 'points', xp: 'XP', streak: 'day streak', days: 'days' },
      fanCup: { title: 'Arab Fan Cup', subtitle: 'Which country has the biggest fans?', points: 'pts', rank: 'Rank', country: 'Country' },
      city: { title: 'City League', subtitle: 'Your city vs the world', lebanon: 'Lebanon Cities', syria: 'Syria Cities' },
      cafe: { title: 'Café Fan Zone', subtitle: 'Join your local café', join: 'Join Café', code: 'Café Code', enterCode: 'Enter café code to join', members: 'Members', create: 'Create Café', name: 'Café Name', location: 'Location' },
      matchRoom: { title: 'Match Room', placeholder: 'Type a message...', send: 'Send', live: 'LIVE' },
      posterBattle: { title: 'Poster Battle', daily: 'Daily Battle', weekly: 'Weekly Battle', entries: 'Entries', vote: 'Vote', winners: 'Winners', enter: 'Enter Battle' },
      arena: { title: 'Arena Wall', subtitle: 'The heartbeat of the fans', post: 'Post', comment: 'Comment', share: 'Share', report: 'Report', createPost: 'What is on your mind?', moments: 'Match Moments', hotTake: 'Daily Hot Take', vote: 'Vote', results: 'Results', teamWall: 'Team Wall', countryWall: 'Country Wall', yourTitle: 'Your Title', streak: 'Arena Streak', days: 'day streak', noPosts: 'No posts yet. Be the first!', publishPrediction: 'Publish to Arena', published: 'Published!', agree: 'Agree', disagree: 'Disagree', topVoice: 'Top Voice', moment: { goal: 'GOAL!', var: 'VAR', penalty: 'Penalty', red_card: 'Red Card', half_time: 'Half Time', full_time: 'Full Time', shock: 'Shock' }, reactions: { goal: 'GOAL', var: 'VAR', fire: 'Fire', shock: 'Shock', laugh: 'Laugh', heart: 'Heart', trophy: 'Trophy' }, filterAll: 'All', filterText: 'Text', filterPrediction: 'Predictions', filterMoment: 'Moments', filterHotTake: 'Hot Takes' },
      legal: { free: 'Free prediction game. No gambling. No cash-out. Points have no monetary value.' },
    },
  },
  ar: {
    translation: {
      app: { name: 'QuizGoal 2026', by: 'من eyedeaz', tagline: 'تحدّى، توقّع، شارك، واربح' },
      nav: { home: 'الرئيسية', arena: 'الساحة', schedule: 'الجدول', battle: 'التحدي', predict: 'التوقعات', poster: 'البوستر', rewards: 'المكافآت', profile: 'الملف', leaderboards: 'المتصدرين', sponsors: 'الرعاة', friends: 'الأصدقاء', fanCup: 'كأس المشجعين', city: 'دوري المدن', cafe: 'المقاهي' },
      cta: { start: 'ابدأ اللعب', createPoster: 'اصنع بوستر', viewRewards: 'عرض المكافآت' },
      home: { nextMatch: 'المباراة القادمة', dailyMission: 'المهمة اليومية', featured: 'تحدي مميز', teamWar: 'حرب المنتخبات', yourRank: 'ترتيبك', totalPoints: 'النقاط', level: 'المستوى' },
      battle: { solo: 'سباق فردي', pvp: 'تحدي 1 ضد 1', friend: 'تحدي صديق', daily: 'التحدي اليومي', teamWar: 'مسابقة حرب المنتخبات', quickCorrect: 'الإجابات السريعة تعطي نقاط أكثر!', streak: 'مكافأة التتابع!', perfect: 'تحدي كامل!', win: 'فائز!', lose: 'محاولة جيدة!', results: 'نتائج التحدي', share: 'مشاركة النتيجة', searching: 'جاري البحث عن خصم...', matchmaking: 'سيتم المطابقة قريباً', cancel: 'إلغاء', playAgain: 'العب مرة أخرى', back: 'رجوع', findOpponent: 'ابحث عن خصم', draw: 'تعادل' },
      predict: { title: 'التوقعات', matchWinner: 'الفائز بالمباراة', exactScore: 'النتيجة الدقيقة', firstGoal: 'أول فريق يسجل', totalGoals: 'مجموع الأهداف', cleanSheet: 'شباك نظيفة', playerMatch: 'أفضل لاعب', groupWinner: 'فائز المجموعة', tournamentWinner: 'بطل البطولة', lockAt: 'يُقفل عند', points: 'نقطة', disclaimer: 'هذه لعبة توقعات مجانية. لا يوجد إيداع. لا يوجد رهان. لا يوجد سحب أموال. النقاط مخصصة للجوائز والخصومات فقط.' },
      poster: { title: 'صانع البوسترات', upload: 'رفع صورة', selectTeam: 'اختر المنتخب', selectStyle: 'اختر النمط', slogan: 'اكتب الشعار', generate: 'إنشاء البوستر', download: 'تحميل', share: 'مشاركة', gallery: 'معرض البوسترات', vote: 'تصويت', report: 'تبليغ' },
      rewards: { title: 'سوق المكافآت', redeem: 'استبدال', points: 'نقطة', quantity: 'متوفر', expires: 'ينتهي', terms: 'الشروط', code: 'رمز الاستبدال', scanned: 'أظهر هذا الرمز للراعي' },
      leaderboard: { global: 'العالمي', daily: 'اليومي', weekly: 'الأسبوعي', team: 'المنتخبات', region: 'المنطقة', friends: 'الأصدقاء', rank: 'الترتيب', player: 'اللاعب', points: 'النقاط' },
      teamwar: { title: 'حرب المنتخبات', ranking: 'ترتيب المنتخبات', yourTeam: 'منتخبك', needs: 'يحتاج', toPass: 'نقطة لتجاوز' },
      street: { title: 'دوري شوارع لبنان', representing: 'أنا عم مثّل', on: 'على QuizGoal 2026' },
      missions: { title: 'المهام اليومية', play: 'العب 3 تحديات', win: 'اربح تحدياً واحداً', predict: 'توقّع مباراتين', create: 'اصنع بوستراً واحداً', vote: 'صوّت على 5 بوسترات', share: 'شارك نتيجة', invite: 'ادع صديقاً', progress: 'التقدم', completed: 'مكتمل!' },
      profile: { title: 'ملفي', edit: 'تعديل الملف', settings: 'الإعدادات', language: 'اللغة', referrals: 'الدعوات', logout: 'تسجيل خروج', memberSince: 'عضو منذ', notifications: 'الإشعارات', matchReminders: 'تذكير بالمباريات', predictionResults: 'نتائج التوقعات', pushPermission: 'اسمح بالإشعارات للحصول على تذكير بالمباريات ونتائج التوقعات', pushEnabled: 'الإشعارات مفعلة', pushDisabled: 'الإشعارات معطلة', enable: 'تفعيل', disable: 'تعطيل' },
      auth: { login: 'تسجيل دخول', signup: 'إنشاء حساب', email: 'البريد الإلكتروني', password: 'كلمة المرور', username: 'اسم المستخدم', magicLink: 'رابط سحري', or: 'أو تابع بواسطة' },
      onboarding: { title: 'أهلاً بك في QuizGoal 2026!', subtitle: 'جهّز ملفك الشخصي للبدء', pickTeam: 'اختر منتخبك المفضل', pickCountry: 'اختر بلدك', pickRegion: 'اختر منطقتك (لبنان)', pickLanguage: 'اللغة المفضلة', acceptRules: 'أتفهم أن هذه لعبة توقعات مجانية. لا يوجد قمار. لا يوجد سحب أموال. النقاط ليس لها قيمة نقدية.', start: 'ابدأ اللعب!' },
      friends: { title: 'الأصدقاء', challenge: 'تحدي', incomingChallenge: 'يتحداك!', accept: 'قبول', decline: 'رفض', noFriends: 'لا يوجد أصدقاء', pending: 'في الانتظار', add: 'إضافة', requestSent: 'تم إرسال طلب الصداقة', requestAccepted: 'تم قبول طلب الصداقة' },
      sponsor: { title: 'رعاتنا', offers: 'العروض', contact: 'تواصل', sponsored: 'تحدي برعاية' },
      admin: { overview: 'ملخص', users: 'المستخدمين', questions: 'الأسئلة', categories: 'الفئات', teams: 'المنتخبات', matches: 'المباريات', predictions: 'التوقعات', posters: 'البوسترات', sponsors: 'الرعاة', rewards: 'المكافآت', redemptions: 'الاستبدالات', missions: 'المهام', sponsorPayments: 'مدفوعات الرعاة', settings: 'الإعدادات' },
      common: { loading: 'جارٍ التحميل...', error: 'حدث خطأ ما', retry: 'إعادة محاولة', save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', create: 'إنشاء', search: 'بحث', filter: 'تصفية', back: 'رجوع', next: 'التالي', done: 'تم', points: 'نقطة', xp: 'نقاط خبرة', streak: 'يوم متتالي', days: 'أيام' },
      fanCup: { title: 'كأس المشجعين العرب', subtitle: 'أي بلد لديه أكبر جمهور؟', points: 'نقطة', rank: 'الترتيب', country: 'البلد' },
      city: { title: 'دوري المدن', subtitle: 'مدينتك ضد العالم', lebanon: 'مدن لبنان', syria: 'مدن سوريا' },
      cafe: { title: 'ركن المقاهي', subtitle: 'انضم إلى مقهى منطقتك', join: 'انضم', code: 'رمز المقهى', enterCode: 'أدخل رمز المقهى للانضمام', members: 'الأعضاء', create: 'إنشاء مقهى', name: 'اسم المقهى', location: 'الموقع' },
      matchRoom: { title: 'غرفة المباراة', placeholder: 'اكتب رسالة...', send: 'إرسال', live: 'مباشر' },
      posterBattle: { title: 'معركة البوسترات', daily: 'معركة اليوم', weekly: 'معركة الأسبوع', entries: 'المشاركات', vote: 'تصويت', winners: 'الفائزون', enter: 'اشترك في المعركة' },
      arena: { title: 'ساحة الجماهير', subtitle: 'نبض المشجعين', post: 'نشر', comment: 'تعليق', share: 'مشاركة', report: 'تبليغ', createPost: 'ما الذي يدور في ذهنك؟', moments: 'لحظات المباراة', hotTake: 'رأي اليوم', vote: 'تصويت', results: 'النتائج', teamWall: 'جدار المنتخب', countryWall: 'جدار البلد', yourTitle: 'لقبك', streak: 'التتابع', days: 'يوم متتالي', noPosts: 'لا توجد منشورات بعد. كن أول من ينشر!', publishPrediction: 'انشر في الساحة', published: 'تم النشر!', agree: 'موافق', disagree: 'غير موافق', topVoice: 'صوت مسموع', moment: { goal: 'هدف!', var: 'VAR', penalty: 'ضربة جزاء', red_card: 'بطاقة حمراء', half_time: 'نهاية الشوط', full_time: 'نهاية المباراة', shock: 'مفاجأة' }, reactions: { goal: 'هدف', var: 'VAR', fire: 'نار', shock: 'صدمة', laugh: 'ضحك', heart: 'قلب', trophy: 'كأس' }, filterAll: 'الكل', filterText: 'نصوص', filterPrediction: 'توقعات', filterMoment: 'لحظات', filterHotTake: 'آراء' },
      legal: { free: 'لعبة توقعات مجانية. لا قمار. لا سحب أموال. النقاط ليس لها قيمة نقدية.' },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
