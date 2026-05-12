import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const links = [
  { to: '/dashboard', label: 'Обзор' },
  { to: '/dashboard/orders', label: 'Заказы' },
  { to: '/dashboard/customers', label: 'Клиенты' },
  { to: '/dashboard/categories', label: 'Категории' },
  { to: '/dashboard/flowers', label: 'Цветы' },
  { to: '/dashboard/promotions', label: 'Акции' },
  { to: '/dashboard/settings', label: 'Настройки' },
];

export function DashboardNav() {
  const { logout, user } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/');
  };

  return (
    <div className="border-b border-rule mb-12 -mx-4 px-4 overflow-x-auto">
      <div className="flex gap-1 min-w-max items-center justify-between">
        <div className="flex gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  'px-5 py-4 text-[11px] tracking-[0.25em] uppercase font-medium transition-colors border-b-2',
                  isActive
                    ? 'text-red border-red'
                    : 'text-ink-muted border-transparent hover:text-ink-primary'
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4 pl-4">
          {user && (
            <span className="text-[11px] tracking-[0.2em] uppercase text-ink-muted hidden md:inline">
              {user.first_name || user.username}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-[11px] tracking-[0.25em] uppercase font-medium text-ink-muted hover:text-red transition-colors"
            title="Выйти"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Выйти</span>
          </button>
        </div>
      </div>
    </div>
  );
}
