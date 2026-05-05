import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, ShoppingBag, AlertTriangle, Users, Package, ArrowRight,
} from 'lucide-react';
import api from '@/lib/api';
import { DashboardOverview as DashboardData } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRub } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  processing: 'В работе',
  ready: 'Готов',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get<DashboardData>('/dashboard/overview/')
      .then((r) => setData(r.data))
      .catch(() => {});
  }, []);

  if (!data) {
    return <div className="container py-20 text-center text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="flex items-baseline justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl">Дашборд</h1>
          <p className="text-muted-foreground">{data.shop.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/dashboard/orders"><Button variant="outline" size="sm">Заказы</Button></Link>
          <Link to="/dashboard/customers"><Button variant="outline" size="sm">Клиенты</Button></Link>
          <Link to="/dashboard/flowers"><Button variant="outline" size="sm">Цветы</Button></Link>
          <Link to="/dashboard/categories"><Button variant="outline" size="sm">Категории</Button></Link>
          <Link to="/dashboard/promotions"><Button variant="outline" size="sm">Акции</Button></Link>
          <Link to="/dashboard/settings"><Button variant="outline" size="sm">Настройки</Button></Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Выручка сегодня"
          value={formatRub(data.revenue.today)}
          trend={`${formatRub(data.revenue.this_month)} за месяц`}
        />
        <KpiCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Заказов сегодня"
          value={String(data.orders.today)}
          trend={`${data.orders.pending_payment} ждут оплаты`}
        />
        <KpiCard
          icon={<Package className="h-5 w-5" />}
          label="Цветов в каталоге"
          value={String(data.inventory.total_flowers)}
          trend={
            data.inventory.low_stock_flowers > 0
              ? `${data.inventory.low_stock_flowers} заканчиваются`
              : 'остатки в норме'
          }
          alert={data.inventory.low_stock_flowers > 0 || data.inventory.out_of_stock_flowers > 0}
        />
        <KpiCard
          icon={<Users className="h-5 w-5" />}
          label="Клиентов"
          value={String(data.customers.total)}
          trend="всего"
        />
      </div>

      {/* Alerts */}
      {(data.inventory.out_of_stock_flowers > 0 || data.inventory.low_stock_flowers > 0) && (
        <Card className="p-4 bg-amber-50 border-amber-200 mb-8 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-amber-900">Внимание со стоком</div>
            <div className="text-sm text-amber-800">
              {data.inventory.out_of_stock_flowers > 0 && (
                <>{data.inventory.out_of_stock_flowers} цветов закончились. </>
              )}
              {data.inventory.low_stock_flowers > 0 && (
                <>{data.inventory.low_stock_flowers} цветов заканчиваются. </>
              )}
              <Link to="/dashboard/flowers" className="text-amber-900 font-medium underline">
                Посмотреть склад
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Recent orders */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-2xl">Последние заказы</h2>
          <Link to="/dashboard/orders" className="text-sm text-blush-600 hover:underline inline-flex items-center gap-1">
            Все заказы <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {data.recent_orders.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">Заказов пока нет</Card>
        ) : (
          <div className="space-y-2">
            {data.recent_orders.slice(0, 8).map((o) => (
              <Card key={o.number} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-medium">№ {o.number}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.customer_name} · {new Date(o.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
                <Badge variant="secondary">{STATUS_LABEL[o.status] ?? o.status}</Badge>
                <div className="font-display text-xl">{formatRub(o.total)}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon, label, value, trend, alert = false,
}: {
  icon: React.ReactNode; label: string; value: string; trend?: string; alert?: boolean;
}) {
  return (
    <Card className={`p-5 ${alert ? 'bg-amber-50 border-amber-200' : ''}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-3">
        <span className={alert ? 'text-amber-700' : 'text-blush-600'}>{icon}</span>
        {label}
      </div>
      <div className="font-display text-3xl">{value}</div>
      {trend && <div className="text-xs text-muted-foreground mt-1">{trend}</div>}
    </Card>
  );
}
