import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
  return (
    <div className="border-b border-rule mb-12 -mx-4 px-4 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
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
                  : 'text-ink-muted border-transparent hover:text-white'
              )
            }
          >
            {l.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
