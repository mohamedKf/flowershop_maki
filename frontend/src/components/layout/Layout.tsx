import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Layout() {
  const loc = useLocation();
  // Homepage handles its own immersive layout (rail, petals, etc.)
  const isHome = loc.pathname === '/';
  return (
    <div className="min-h-screen flex flex-col bg-bg-base text-white">
      {!isHome && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isHome && <Footer />}
    </div>
  );
}
