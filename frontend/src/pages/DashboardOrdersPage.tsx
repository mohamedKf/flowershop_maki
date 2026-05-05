import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Order } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatRub } from '@/lib/utils';

const STATUSES = ['pending', 'paid', 'processing', 'ready', 'delivered', 'cancelled'];
const LABEL: Record<string, string> = {
  pending: 'Ожидает оплаты', paid: 'Оплачен', processing: 'В работе',
  ready: 'Готов', delivered: 'Доставлен', cancelled: 'Отменён',
};

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    if (search) params.set('q', search);
    const r = await api.get<Order[]>(`/dashboard/orders/?${params}`);
    setOrders(r.data);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (number: string, status: string) => {
    await api.patch(`/dashboard/orders/${number}/status/`, { status });
    load();
  };

  return (
    <div className="container py-8">
      <h1 className="font-display text-4xl mb-6">Заказы</h1>

      <div className="flex gap-3 mb-6 flex-wrap">
        <Input
          placeholder="Поиск по номеру, имени, телефону"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          className="max-w-sm"
        />
        <Button onClick={load} variant="outline">Найти</Button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-1.5 rounded-full text-sm ${filter === '' ? 'bg-foreground text-background' : 'bg-white border border-blush-200'}`}
        >
          Все
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm ${filter === s ? 'bg-foreground text-background' : 'bg-white border border-blush-200'}`}
          >
            {LABEL[s]}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Ничего не найдено</Card>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <Card key={o.number} className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                <div>
                  <div className="font-medium">№ {o.number}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.customer_name} · {o.customer_phone} ·{' '}
                    {new Date(o.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
                <Badge variant="secondary">{LABEL[o.status] ?? o.status}</Badge>
                <div className="font-display text-xl">{formatRub(o.total)}</div>
              </div>
              <div className="flex gap-2 flex-wrap pt-3 border-t border-blush-100">
                {STATUSES.filter((s) => s !== o.status).map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatus(o.number, s)}
                  >
                    → {LABEL[s]}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
