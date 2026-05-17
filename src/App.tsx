import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './store/useAuth';
import { useUI } from './store/useUI';
import { Toaster } from 'react-hot-toast';
import { checkPredictionResults } from './lib/usePushNotifications';
import { AnimatePresence, motion } from 'framer-motion';
import Landing from './pages/landing';
import Login from './pages/auth/login';
import Signup from './pages/auth/signup';
import Onboarding from './pages/onboarding';
import Home from './pages/home';
import BattleIndex from './pages/battle/index';
import SoloBattle from './pages/battle/solo';
import PvpBattle from './pages/battle/pvp';
import DailyChallenge from './pages/battle/daily';
import Predictions from './pages/predict/index';
import PosterIndex from './pages/poster/index';
import PosterGenerator from './pages/poster/generator';
import PosterGallery from './pages/poster/gallery';
import RewardsIndex from './pages/rewards/index';
import LeaderboardIndex from './pages/leaderboard/index';
import SponsorsIndex from './pages/sponsors/index';
import TeamWarIndex from './pages/teamwar/index';
import StreetLeagueIndex from './pages/streetleague/index';
import MissionsIndex from './pages/missions/index';
import FanCupPage from './pages/fan-cup/index';
import CityLeaguePage from './pages/city-league/index';
import CafePage from './pages/cafe/index';
import PosterBattle from './pages/poster/battle';
import ProfileIndex from './pages/profile/index';
import FriendsPage from './pages/friends/index';
import FriendChat from './pages/friends/chat';
import SchedulePage from './pages/schedule/index';
import BracketPage from './pages/bracket/index';
import MatchRoom from './pages/match-room';
import ArenaWall from './pages/arena/index';
import TeamWall from './pages/team-wall';
import CountryWall from './pages/country-wall';
import AdminLayout from './components/layout/AdminLayout';
import AdminOverview from './pages/admin/overview';
import AdminUsers from './pages/admin/users';
import AdminQuestions from './pages/admin/questions';
import AdminTeams from './pages/admin/teams';
import AdminMatches from './pages/admin/matches';
import AdminSponsors from './pages/admin/sponsors';
import AdminRewards from './pages/admin/rewards';
import AdminSettings from './pages/admin/settings';
import AdminSponsorPayments from './pages/admin/sponsor-payments';
import SponsorLayout from './pages/sponsor/layout';
import SponsorLogin from './pages/sponsor/login';
import SponsorRegister from './pages/sponsor/register';
import SponsorDashboard from './pages/sponsor/index';
import SponsorPackages from './pages/sponsor/packages';
import SponsorCheckout from './pages/sponsor/checkout';
import SponsorOffers from './pages/sponsor/offers';
import SponsorRedemptions from './pages/sponsor/redemptions';
import MobileNav from './components/layout/MobileNav';
import DesktopNav from './components/layout/DesktopNav';
import PwaInstallPrompt from './components/common/PwaInstallPrompt';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

const pages: Record<string, React.FC> = {
  '/': Landing,
  '/login': Login,
  '/signup': Signup,
  '/onboarding': Onboarding,
  '/home': Home,
  '/battle': BattleIndex,
  '/battle/solo': SoloBattle,
  '/battle/pvp': PvpBattle,
  '/battle/daily': DailyChallenge,
  '/predict': Predictions,
  '/poster': PosterIndex,
  '/poster/generator': PosterGenerator,
  '/poster/gallery': PosterGallery,
  '/rewards': RewardsIndex,
  '/leaderboard': LeaderboardIndex,
  '/sponsors': SponsorsIndex,
  '/teamwar': TeamWarIndex,
  '/streetleague': StreetLeagueIndex,
  '/missions': MissionsIndex,
  '/profile': ProfileIndex,
  '/friends': FriendsPage,
  '/friends/chat': FriendChat,
  '/schedule': SchedulePage,
  '/bracket': BracketPage,
  '/fan-cup': FanCupPage,
  '/city-league': CityLeaguePage,
  '/cafe': CafePage,
  '/poster/battle': PosterBattle,
  '/match-room': MatchRoom,
  '/arena': ArenaWall,
  '/team-wall': TeamWall,
  '/country-wall': CountryWall,
};

const adminPages: Record<string, React.FC> = {
  '/admin': AdminOverview,
  '/admin/users': AdminUsers,
  '/admin/questions': AdminQuestions,
  '/admin/teams': AdminTeams,
  '/admin/matches': AdminMatches,
  '/admin/sponsors': AdminSponsors,
  '/admin/rewards': AdminRewards,
  '/admin/settings': AdminSettings,
  '/admin/sponsor-payments': AdminSponsorPayments,
};

const sponsorPages: Record<string, React.FC> = {
  '/sponsor/login': SponsorLogin,
  '/sponsor/register': SponsorRegister,
  '/sponsor/dashboard': SponsorDashboard,
  '/sponsor/packages': SponsorPackages,
  '/sponsor/checkout': SponsorCheckout,
  '/sponsor/offers': SponsorOffers,
  '/sponsor/redemptions': SponsorRedemptions,
};

function useRouter() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setPath(to);
  };

  return { path, navigate };
}

function PageContent() {
  const { path, navigate } = useRouter();
  const { profile, user } = useAuth();

  const isAdmin = profile?.role === 'admin';

  if (path.startsWith('/admin')) {
    if (!isAdmin) {
      navigate('/home');
      return null;
    }
    const Page = adminPages[path] || adminPages['/admin'];
    return (
      <AdminLayout>
        <Page />
      </AdminLayout>
    );
  }

  if (path.startsWith('/sponsor')) {
    if (path === '/sponsor/login' || path === '/sponsor/register') {
      const Page = sponsorPages[path];
      return <Page />;
    }
    const Page = sponsorPages[path] || sponsorPages['/sponsor/dashboard'];
    return (
      <SponsorLayout>
        <Page />
      </SponsorLayout>
    );
  }

  const Page = pages[path] || pages['/home'];

  const showNav = user && path !== '/' && path !== '/login' && path !== '/signup' && path !== '/onboarding';

  return (
    <div className="min-h-screen bg-navy text-white stadium-bg football-grid">
      <div className="hidden lg:block fixed top-0 left-0 h-full w-64 z-50">
        <DesktopNav />
      </div>
      <main className="lg:ml-64 min-h-screen">
        <div className={showNav ? 'pb-24 lg:pb-8' : ''}>
          <div className="p-3 sm:p-4 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={path}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Page />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      {showNav && <MobileNav />}
      <Toaster position="top-center" toastOptions={{
        style: { background: '#132042', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
      }} />
      <PwaInstallPrompt />
    </div>
  );
}

export default function App() {
  const { init, loading, setLoading } = useAuth();
  const { language } = useUI();

  useEffect(() => { init(); }, [init]);

  // Force hide loading after 10s no matter what
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 10000);
    return () => clearTimeout(t);
  }, [setLoading]);
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    const { profile } = useAuth.getState();
    if (profile) {
      checkPredictionResults(profile.id);
      const interval = setInterval(() => checkPredictionResults(profile.id), 300000);
      return () => clearInterval(interval);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="text-center">
          <div className="text-5xl animate-football-spin mx-auto mb-4">⚽</div>
          <div className="text-2xl font-bold text-gradient">QuizGoal</div>
          <div className="text-white/40">2026</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PageContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
