import { NavLink } from 'react-router-dom';
import { Home, Grid3x3, Flower2, ShoppingCart, User, LayoutDashboard } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface TabProps {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  end?: boolean;
}

function Tab({ to, label, icon: Icon, badge, end }: TabProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors relative flex-1 min-w-0',
          isActive ? 'text-red' : 'text-ink-muted'
        )
      }
    >
      <div className="relative">
        <Icon className="w-[22px] h-[22px]" strokeWidth={1.5} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 bg-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] tracking-[0.1em] uppercase font-medium truncate w-full text-center">
        {label}
      </span>
    </NavLink>
  );
}

export function BottomTabBar() {
  const { user } = useAuth();
  const { itemCount } = useCart();

  // Different tab set depending on user role
  const isStaff = user && user.role !== 'customer';

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-base/95 backdrop-blur-xl border-t border-rule"
      style={{
        // Safe area inset for iPhone notch/home indicator
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="grid grid-cols-5 max-w-md mx-auto">
        <Tab to="/" label="Главная" icon={Home} end />
        <Tab to="/catalog" label="Букеты" icon={Grid3x3} />
        <Tab to="/custom-bouquet" label="Свой" icon={Flower2} />

        {/* Slot 4: Cart for customers/guests, Dashboard for staff */}
        {isStaff ? (
          <Tab to="/dashboard" label="Панель" icon={LayoutDashboard} />
        ) : (
          <Tab to="/cart" label="Корзина" icon={ShoppingCart} badge={itemCount} />
        )}

        {/* Slot 5: Account or Login */}
        <Tab
          to={user ? (user.role === 'customer' ? '/account' : '/dashboard') : '/login'}
          label={user ? 'Профиль' : 'Войти'}
          icon={User}
        />
      </div>
    </nav>
  );
}
