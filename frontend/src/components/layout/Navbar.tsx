import { Link, NavLink } from 'react-router-dom';
import { Search, ShoppingCart, User } from 'lucide-react';
import { useShop } from '@/contexts/ShopContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { shop, extras } = useShop();
  const { itemCount } = useCart();
  const { user } = useAuth();

  const cityLabel = extras.city || 'Анапа';
  const shopName = shop?.name || 'Маки';

  return (
    <header className="sticky top-0 z-50 bg-bg-base/90 backdrop-blur-xl border-b border-rule">
      {/* Top thin strip */}
      <div className="border-b border-rule">
        <div className="container flex items-center justify-between py-2 text-[11px] tracking-[0.18em] uppercase text-ink-muted">
          <span>{cityLabel} · {extras.deliveryTimeText}</span>
          <span className="hidden md:inline">{extras.hoursText}</span>
        </div>
      </div>

      {/* Main row */}
      <div className="container grid grid-cols-[1fr_auto_1fr] items-center gap-6 py-5">
        {/* Left: nav links */}
        <nav className="flex items-center gap-7 text-[11px] tracking-[0.22em] uppercase">
          <NavLinkUnderline to="/catalog" label="Букеты" />
          <NavLinkUnderline to="/custom-bouquet" label="Свой букет" />
          <NavLinkUnderline to="/about" label="О нас" />
        </nav>

        {/* Center: brand */}
        <Link to="/" className="text-center group">
          <div className="font-script text-3xl text-white leading-none group-hover:text-red transition-colors">
            {shopName === 'Маки' ? 'маки' : shopName}
          </div>
          <div className="text-[9px] tracking-[0.5em] uppercase text-red mt-1">
            Студия флористики
          </div>
        </Link>

        {/* Right: icons */}
        <div className="flex items-center justify-end gap-4">
          <button
            aria-label="Поиск"
            className="w-10 h-10 border border-rule flex items-center justify-center hover:border-red hover:text-red transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          <Link
            to={user ? (user.role === 'customer' ? '/account' : '/dashboard') : '/login'}
            aria-label="Аккаунт"
            className="w-10 h-10 border border-rule flex items-center justify-center hover:border-red hover:text-red transition-colors"
          >
            <User className="w-4 h-4" />
          </Link>

          <Link
            to="/cart"
            aria-label="Корзина"
            className="relative w-10 h-10 border border-rule flex items-center justify-center hover:border-red hover:text-red transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red text-white text-[10px] font-bold flex items-center justify-center border-2 border-bg-base">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLinkUnderline({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'relative font-medium transition-colors',
          isActive ? 'text-red' : 'text-white hover:text-red'
        )
      }
    >
      {({ isActive }) => (
        <>
          {label}
          <span
            className={cn(
              'absolute -bottom-1.5 left-0 h-px bg-red transition-all duration-300',
              isActive ? 'w-full' : 'w-0'
            )}
          />
        </>
      )}
    </NavLink>
  );
}
