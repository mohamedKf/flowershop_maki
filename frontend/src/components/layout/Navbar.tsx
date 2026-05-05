import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, User as UserIcon, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useShop } from '@/contexts/ShopContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { shop } = useShop();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Show first comma-separated chunk of address as the "city" subtitle
  const cityTag = shop?.address?.split(',')[0]?.trim() || '';
  const shopName = shop?.name || 'Цветочная';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-sm font-medium transition-colors hover:text-primary',
      isActive ? 'text-primary' : 'text-foreground/70'
    );

  return (
    <header className="sticky top-0 z-40 border-b border-blush-100 bg-white/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-medium tracking-tight">{shopName}</span>
          {cityTag && (
            <>
              <span className="text-xs text-blush-500 font-medium">·</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">{cityTag}</span>
            </>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/" end className={navLinkClass}>Главная</NavLink>
          <NavLink to="/catalog" className={navLinkClass}>Каталог</NavLink>
          <NavLink to="/custom-bouquet" className={navLinkClass}>Свой букет</NavLink>
          <NavLink to="/about" className={navLinkClass}>О нас</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-5 w-5" />
              {cart && cart.item_count > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
                  {cart.item_count}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              {(user.role === 'manager' || user.role === 'worker') && (
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">Дашборд</Button>
                </Link>
              )}
              <Link to="/account">
                <Button variant="ghost" size="icon">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>Выйти</Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login"><Button variant="ghost" size="sm">Войти</Button></Link>
              <Link to="/signup"><Button size="sm">Регистрация</Button></Link>
            </div>
          )}

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Меню"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-blush-100 bg-white">
          <div className="container py-4 flex flex-col gap-3">
            <NavLink to="/" end className={navLinkClass} onClick={() => setMobileOpen(false)}>Главная</NavLink>
            <NavLink to="/catalog" className={navLinkClass} onClick={() => setMobileOpen(false)}>Каталог</NavLink>
            <NavLink to="/custom-bouquet" className={navLinkClass} onClick={() => setMobileOpen(false)}>Свой букет</NavLink>
            <NavLink to="/about" className={navLinkClass} onClick={() => setMobileOpen(false)}>О нас</NavLink>
            {user ? (
              <>
                {(user.role === 'manager' || user.role === 'worker') && (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">Дашборд</Button>
                  </Link>
                )}
                <Button variant="outline" onClick={() => { logout(); setMobileOpen(false); }}>Выйти</Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">Войти</Button>
                </Link>
                <Link to="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Регистрация</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
