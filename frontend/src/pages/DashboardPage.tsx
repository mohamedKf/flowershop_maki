import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { DashboardOverview } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRub, formatDateTime } from '@/lib/utils';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { TrendingUp, ShoppingBag, Package, Users, ArrowRight, AlertTriangle } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  processing: 'В работе',
  ready: 'Готов',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    api.get<DashboardOverview>('/dashboard/overview/').then((r) => setData(r.data)).catch(() => {});
  }, []);

  return (
    <div className="container py-12">
      <div className="eyebrow mb-4">— Управление</div>
      <h1 className="section-title mb-3">{data?.shop.name || 'Дашборд'}</h1>
      <p className="text-ink-muted mb-12">
        {data?.shop.address}
      </p>

      <DashboardNav />

      {!data ? (
        <div className="py-20 text-center text-ink-muted text-sm tracking-[0.3em] uppercase">
          Загрузка...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <Kpi
              icon={<TrendingUp className="w-4 h-4" />}
              label="Выручка сегодня"
              value={formatRub(data.revenue.today)}
              trend={`${formatRub(data.revenue.this_month)} за месяц`}
            />
            <Kpi
              icon={<ShoppingBag className="w-4 h-4" />}
              label="Заказов сегодня"
              value={String(data.orders.today)}
              trend={`${data.orders.pending_payment} ждут оплаты`}
            />
            <Kpi
              icon={<Package className="w-4 h-4" />}
              label="Цветов в каталоге"
              value={String(data.inventory.total_flowers)}
              trend={data.inventory.low_stock_flowers > 0 ? `${data.inventory.low_stock_flowers} заканчиваются` : 'остатки в норме'}
              alert={data.inventory.low_stock_flowers > 0 || data.inventory.out_of_stock_flowers > 0}
            />
            <Kpi
              icon={<Users className="w-4 h-4" />}
              label="Клиентов"
              value={String(data.customers.total)}
              trend={`${data.customers.new_this_month} новых за месяц`}
            />
          </div>

          {(data.inventory.out_of_stock_flowers > 0 || data.inventory.low_stock_flowers > 0) && (
            <Card className="p-5 mb-10 flex gap-4 items-start border-red/40">
              <AlertTriangle className="w-5 h-5 text-red flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-red text-[11px] tracking-[0.25em] uppercase mb-1.5 font-medium">
                  Внимание со стоком
                </div>
                <p className="text-sm text-ink-body">
                  {data.inventory.out_of_stock_flowers > 0 && `${data.inventory.out_of_stock_flowers} цветов закончились. `}
                  {data.inventory.low_stock_flowers > 0 && `${data.inventory.low_stock_flowers} заканчиваются. `}
                  <Link to="/dashboard/flowers" className="text-red hover:underline">Посмотреть склад →</Link>
                </p>
              </div>
            </Card>
          )}

          <div className="flex justify-between items-baseline mb-5">
            <h2 className="font-display text-3xl text-white">Последние заказы</h2>
            <Link
              to="/dashboard/orders"
              className="text-[11px] tracking-[0.25em] uppercase text-ink-body hover:text-red flex items-center gap-2"
            >
              Все заказы <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {data.recent_orders.length === 0 ? (
            <Card className="p-12 text-center text-ink-muted">Заказов пока нет</Card>
          ) : (
            <div className="space-y-3">
              {data.recent_orders.slice(0, 8).map((o) => (
                <Card key={o.number} className="p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="font-medium text-white">№ {o.number}</div>
                    <div className="text-xs text-ink-muted mt-1">
                      {o.customer_name} · {formatDateTime(o.created_at)}
                    </div>
                  </div>
                  <Badge variant="secondary">{STATUS_LABEL[o.status] || o.status}</Badge>
                  <div className="font-display text-xl text-red">{formatRub(o.total)}</div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Kpi({
  icon, label, value, trend, alert = false,
}: { icon: React.ReactNode; label: string; value: string; trend?: string; alert?: boolean }) {
  return (
    <Card className={`p-5 ${alert ? 'border-red/40' : ''}`}>
      <div className={`flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase mb-3 ${alert ? 'text-red' : 'text-ink-muted'}`}>
        {icon}
        {label}
      </div>
      <div className="font-display text-3xl text-white">{value}</div>
      {trend && <div className="text-xs text-ink-faint mt-2">{trend}</div>}
    </Card>
  );
}
