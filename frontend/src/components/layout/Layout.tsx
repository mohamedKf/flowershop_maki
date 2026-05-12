import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BottomTabBar } from './BottomTabBar';
import { Petals } from '@/components/Petals';

// Pages where petals should NOT appear (work / focused / transactional pages)
const NO_PETAL_PATHS = [
  '/checkout',
  '/payment',
  '/dashboard',
];

// Pages where the bottom tab bar should NOT appear on mobile
// (e.g. dashboard has its own nav; login/signup feel cleaner without)
const NO_TABBAR_PATHS = [
  '/dashboard',
];

function startsWithAny(path: string, prefixes: string[]) {
  return prefixes.some((p) => path.startsWith(p));
}

export function Layout() {
  const loc = useLocation();
  const isHome = loc.pathname === '/';

  const showPetals = !isHome && !startsWithAny(loc.pathname, NO_PETAL_PATHS);
  const showTabBar = !startsWithAny(loc.pathname, NO_TABBAR_PATHS);

  return (
    <div className="min-h-screen flex flex-col bg-bg-base text-ink-primary relative">
      {showPetals && <Petals />}
      {!isHome && <Navbar />}
      <main
        className={`flex-1 relative z-10 ${showTabBar ? 'pb-24 md:pb-0' : ''}`}
      >
        <Outlet />
      </main>
      {!isHome && <Footer />}
      {showTabBar && <BottomTabBar />}
    </div>
  );
}
