import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRub } from '@/lib/utils';

interface Customer {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  tier: string;
  total_orders: number;
  total_spent: string;
  average_order_value: string;
  last_order_at: string | null;
  date_joined: string;
}

const TIER_LABEL: Record<string, string> = {
  new: 'Новый', regular: 'Постоянный', vip: 'VIP', dormant: 'Спящий',
};
const TIER_VARIANT: Record<string, any> = {
  new: 'cream', regular: 'secondary', vip: 'default', dormant: 'outline',
};

export default function DashboardCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    api.get<Customer[]>('/dashboard/customers/')
      .then((r) => setCustomers(r.data))
      .catch(() => {});
  }, []);

  return (
    <div className="container py-8">
      <h1 className="font-display text-4xl mb-6">Клиенты</h1>

      {customers.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Нет клиентов</Card>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <Card key={c.user_id} className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <div className="md:col-span-2">
                <div className="font-medium">{c.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  {c.email} {c.phone && `· ${c.phone}`}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground text-xs">Заказов</div>
                <div className="font-medium">{c.total_orders}</div>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground text-xs">Потрачено</div>
                <div className="font-medium">{formatRub(c.total_spent)}</div>
              </div>
              <Badge variant={TIER_VARIANT[c.tier]}>{TIER_LABEL[c.tier] ?? c.tier}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
