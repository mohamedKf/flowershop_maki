import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '@/lib/api';
import type { Order } from '@/lib/types';
import { listFrom, formatRub, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  processing: 'В работе',
  ready: 'Готов',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user) {
      api.get('/orders/').then((r) => setOrders(listFrom<Order>(r.data)));
    }
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="container py-16 md:py-24">
      <div className="flex items-end justify-between flex-wrap gap-6 mb-12 pb-8 border-b border-rule">
        <div>
          <div className="eyebrow mb-4">— Личный кабинет</div>
          <h1 className="section-title">
            {user.first_name || user.username}
          </h1>
          <p className="text-ink-muted mt-3">{user.email}</p>
        </div>
        <Button variant="outline" onClick={logout}>Выйти</Button>
      </div>

      <h2 className="font-display text-3xl mb-6">История заказов</h2>

      {orders.length === 0 ? (
        <div className="bg-bg-card border border-rule p-12 text-center">
          <p className="text-ink-muted mb-6">Пока нет заказов.</p>
          <Link to="/catalog" className="btn-red">В каталог</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-bg-card border border-rule p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-display text-xl text-ink-primary">№ {o.number}</div>
                <div className="text-xs text-ink-muted mt-1">{formatDateTime(o.created_at)}</div>
              </div>
              <div className="text-[11px] tracking-[0.25em] uppercase text-red">
                {STATUS_LABEL[o.status] || o.status}
              </div>
              <div className="font-display text-2xl text-red">{formatRub(o.total)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
