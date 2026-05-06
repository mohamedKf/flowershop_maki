import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { listFrom } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DashboardNav } from '@/components/layout/DashboardNav';

interface Customer {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_joined: string;
  order_count?: number;
  total_spent?: string;
}

export default function DashboardCustomersPage() {
  const [list, setList] = useState<Customer[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/dashboard/customers/').then((r) => setList(listFrom<Customer>(r.data)));
  }, []);

  const filtered = list.filter(
    (c) =>
      !q ||
      `${c.first_name} ${c.last_name} ${c.username} ${c.email}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="container py-12">
      <h1 className="section-title mb-3">Клиенты</h1>
      <DashboardNav />

      <Input
        placeholder="Поиск по имени или email"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md mb-6"
      />

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-ink-muted">Не найдено</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Card key={c.id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="font-medium text-white text-lg">
                  {c.first_name} {c.last_name}
                </div>
                <div className="text-xs text-ink-muted mt-1">
                  {c.email} · {c.phone || '—'}
                </div>
              </div>
              {c.order_count !== undefined && (
                <div className="text-right">
                  <div className="font-display text-xl text-red">
                    {c.order_count} {c.order_count === 1 ? 'заказ' : 'заказов'}
                  </div>
                  {c.total_spent && (
                    <div className="text-xs text-ink-muted">{c.total_spent}</div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
