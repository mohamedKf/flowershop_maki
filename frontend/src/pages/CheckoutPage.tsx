import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Order } from '@/lib/types';
import { useCart, ACTIVE_SHOP_SLUG } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatRub } from '@/lib/utils';

const DELIVERY_COST = 500;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, refresh } = useCart();
  const { user } = useAuth();

  const [form, setForm] = useState({
    customer_name: user ? `${user.first_name} ${user.last_name}`.trim() || user.username : '',
    customer_phone: user?.phone || '',
    customer_email: user?.email || '',
    delivery_method: 'delivery' as 'delivery' | 'pickup',
    delivery_address: '',
    delivery_date: '',
    delivery_time: '',
    note: '',
    promo_code: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cart || cart.item_count === 0) {
    navigate('/cart');
    return null;
  }

  const subtotal = parseFloat(cart.total);
  const deliveryCost = form.delivery_method === 'delivery' ? DELIVERY_COST : 0;
  const total = subtotal + deliveryCost;

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<Order>('/checkout/', {
        ...form,
        shop: ACTIVE_SHOP_SLUG,
        delivery_cost: String(deliveryCost),
      });
      await refresh();
      navigate(`/payment/${res.data.number}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка оформления');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-12">
      <h1 className="font-display text-4xl mb-8">Оформление заказа</h1>

      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <Card className="p-6">
            <h2 className="font-display text-xl mb-4">Контактные данные</h2>
            <div className="grid gap-4">
              <Input
                placeholder="Ваше имя *"
                value={form.customer_name}
                onChange={(e) => update('customer_name', e.target.value)}
                required
              />
              <Input
                placeholder="Телефон *"
                type="tel"
                value={form.customer_phone}
                onChange={(e) => update('customer_phone', e.target.value)}
                required
              />
              <Input
                placeholder="Email"
                type="email"
                value={form.customer_email}
                onChange={(e) => update('customer_email', e.target.value)}
              />
            </div>
          </Card>

          {/* Delivery */}
          <Card className="p-6">
            <h2 className="font-display text-xl mb-4">Доставка</h2>
            <div className="flex gap-3 mb-4">
              <button
                type="button"
                className={`flex-1 rounded-xl border-2 p-4 text-left transition-all ${
                  form.delivery_method === 'delivery'
                    ? 'border-primary bg-blush-50'
                    : 'border-blush-100'
                }`}
                onClick={() => update('delivery_method', 'delivery')}
              >
                <div className="font-medium">Курьером</div>
                <div className="text-xs text-muted-foreground">{formatRub(DELIVERY_COST)} · 2 часа</div>
              </button>
              <button
                type="button"
                className={`flex-1 rounded-xl border-2 p-4 text-left transition-all ${
                  form.delivery_method === 'pickup'
                    ? 'border-primary bg-blush-50'
                    : 'border-blush-100'
                }`}
                onClick={() => update('delivery_method', 'pickup')}
              >
                <div className="font-medium">Самовывоз</div>
                <div className="text-xs text-muted-foreground">бесплатно</div>
              </button>
            </div>

            {form.delivery_method === 'delivery' && (
              <div className="grid gap-4">
                <Input
                  placeholder="Адрес доставки *"
                  value={form.delivery_address}
                  onChange={(e) => update('delivery_address', e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    value={form.delivery_date}
                    onChange={(e) => update('delivery_date', e.target.value)}
                  />
                  <Input
                    placeholder="Время (например, 14:00–16:00)"
                    value={form.delivery_time}
                    onChange={(e) => update('delivery_time', e.target.value)}
                  />
                </div>
              </div>
            )}

            <textarea
              className="w-full mt-4 rounded-xl border border-input bg-white px-4 py-2 text-sm min-h-[80px]"
              placeholder="Комментарий к заказу"
              value={form.note}
              onChange={(e) => update('note', e.target.value)}
            />
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-xl mb-4">Промокод</h2>
            <Input
              placeholder="Введите промокод"
              value={form.promo_code}
              onChange={(e) => update('promo_code', e.target.value.toUpperCase())}
            />
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h2 className="font-display text-xl mb-4">Ваш заказ</h2>
            <div className="space-y-2 mb-4 text-sm">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4">
                  <div>
                    <div className="font-medium truncate">{item.flower_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.is_custom ? `${item.stems} шт` : item.size_label} × {item.quantity}
                    </div>
                  </div>
                  <div className="whitespace-nowrap">{formatRub(item.line_total)}</div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-blush-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Товары</span>
                <span>{formatRub(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Доставка</span>
                <span>{deliveryCost > 0 ? formatRub(deliveryCost) : 'бесплатно'}</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-blush-100">
                <span className="font-medium">Итого</span>
                <span className="font-display text-2xl">{formatRub(total)}</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            <Button type="submit" size="lg" className="w-full mt-6" disabled={submitting}>
              {submitting ? 'Создание...' : 'Перейти к оплате'}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  );
}
