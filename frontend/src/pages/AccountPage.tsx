import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Order } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRub } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  processing: 'В работе',
  ready: 'Готов к доставке',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
  refunded: 'Возврат',
};

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.get<{ results?: Order[] } | Order[]>('/orders/').then((r) => {
      const data = (r.data as any).results ?? r.data;
      setOrders(data);
    }).catch(() => {});
  }, []);

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground mb-4">Войдите, чтобы посмотреть аккаунт</p>
        <Link to="/login"><Button>Войти</Button></Link>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-4xl">
      <h1 className="font-display text-4xl mb-8">Личный кабинет</h1>

      <Card className="p-6 mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Имя пользователя</div>
            <div className="font-display text-2xl mb-3">{user.username}</div>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Email: </span>{user.email}
              </div>
              {user.phone && (
                <div>
                  <span className="text-muted-foreground">Телефон: </span>{user.phone}
                </div>
              )}
              {(user.first_name || user.last_name) && (
                <div>
                  <span className="text-muted-foreground">Имя: </span>
                  {user.first_name} {user.last_name}
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Роль: </span>
                <Badge variant="secondary">
                  {user.role === 'manager' ? 'Менеджер' : user.role === 'worker' ? 'Сотрудник' : 'Клиент'}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>Выйти</Button>
        </div>
      </Card>

      <h2 className="font-display text-2xl mb-4">Мои заказы</h2>
      {orders.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Пока нет заказов. <Link to="/catalog" className="text-blush-600 hover:underline">Перейти в каталог</Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.number} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="font-medium">№ {o.number}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
              <Badge variant="secondary">{STATUS_LABEL[o.status] ?? o.status}</Badge>
              <div className="font-display text-xl">{formatRub(o.total)}</div>
              {o.status === 'pending' && (
                <Link to={`/payment/${o.number}`}>
                  <Button size="sm">Оплатить</Button>
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
