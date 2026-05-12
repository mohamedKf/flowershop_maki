import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Order } from '@/lib/types';
import { listFrom, formatRub, formatDateTime } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { DashboardNav } from '@/components/layout/DashboardNav';

const STATUSES = [
  { v: 'pending', l: 'Ожидает оплаты' },
  { v: 'paid', l: 'Оплачен' },
  { v: 'processing', l: 'В работе' },
  { v: 'ready', l: 'Готов' },
  { v: 'delivered', l: 'Доставлен' },
  { v: 'cancelled', l: 'Отменён' },
];

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');

  const load = () => {
    const url = filter ? `/dashboard/orders/?status=${filter}` : '/dashboard/orders/';
    api.get(url).then((r) => setOrders(listFrom<Order>(r.data)));
  };

  useEffect(load, [filter]);

  const updateStatus = async (orderNumber: string, status: string) => {
    await api.post(`/dashboard/orders/${orderNumber}/status/`, { status });
    load();
  };

  return (
    <div className="container py-12">
      <h1 className="section-title mb-3">Заказы</h1>
      <DashboardNav />

      <div className="mb-6">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs">
          <option value="">Все статусы</option>
          {STATUSES.map((s) => (
            <option key={s.v} value={s.v}>{s.l}</option>
          ))}
        </Select>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center text-ink-muted">Заказов нет</Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id} className="p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <div>
                  <div className="font-display text-xl text-ink-primary">№ {o.number}</div>
                  <div className="text-xs text-ink-muted mt-1">
                    {o.customer_name} · {o.customer_phone} · {formatDateTime(o.created_at)}
                  </div>
                </div>
                <div className="font-display text-2xl text-red">{formatRub(o.total)}</div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-rule">
                <div className="text-sm text-ink-body break-words">{o.delivery_address}</div>
                <Select
                  value={o.status}
                  onChange={(e) => updateStatus(o.number, e.target.value)}
                  className="w-full sm:w-auto sm:max-w-[200px] h-10"
                >
                  {STATUSES.map((s) => (
                    <option key={s.v} value={s.v}>{s.l}</option>
                  ))}
                </Select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
