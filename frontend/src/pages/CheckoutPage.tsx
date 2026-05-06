import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatRub } from '@/lib/utils';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const nav = useNavigate();

  const [name, setName] = useState(user ? `${user.first_name} ${user.last_name}`.trim() : '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  if (!user) return <Navigate to="/login" replace />;
  if (!cart || cart.items.length === 0) return <Navigate to="/cart" replace />;

  const submit = async () => {
    setSubmitting(true);
    setErr('');
    try {
      const r = await api.post('/checkout/', {
        shop: 'flowery',
        customer_name: name,
        customer_phone: phone,
        customer_email: user.email,
        delivery_address: address,
        delivery_notes: notes,
        promo_code: code,
      });
      await refresh();
      nav(`/payment/${r.data.number}`);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Не удалось оформить заказ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-16 md:py-24">
      <div className="mb-12">
        <div className="eyebrow mb-4">— Оформление</div>
        <h1 className="section-title">Контактные <em>данные</em></h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-12">
        <div className="space-y-6 max-w-xl">
          <div>
            <Label>Имя и фамилия</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Телефон</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (900) 000-00-00"
              required
            />
          </div>
          <div>
            <Label>Адрес доставки</Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="Город, улица, дом, квартира"
            />
          </div>
          <div>
            <Label>Комментарий курьеру (необязательно)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>Промокод</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SPRING25"
            />
          </div>

          {err && (
            <div className="text-sm text-red border border-red/40 px-4 py-3">
              {err}
            </div>
          )}
        </div>

        <div className="bg-bg-card border border-rule p-8 h-fit lg:sticky lg:top-32">
          <h3 className="font-display text-2xl text-white mb-6">Итого</h3>

          <div className="space-y-3 mb-6 max-h-72 overflow-y-auto pr-2">
            {cart.items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span className="text-ink-body truncate pr-2">
                  {it.flower_name} × {it.quantity}
                </span>
                <span className="text-white whitespace-nowrap">
                  {formatRub(it.line_total)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-rule pt-6 mb-8 flex justify-between items-baseline">
            <span className="text-[11px] tracking-[0.3em] uppercase text-ink-muted">К оплате</span>
            <span className="font-display text-3xl text-red">
              {formatRub(cart.total)}
            </span>
          </div>

          <Button
            onClick={submit}
            disabled={submitting || !name || !phone || !address}
            size="lg"
            className="w-full"
          >
            {submitting ? 'Оформляем...' : 'К оплате'}
          </Button>
        </div>
      </div>
    </div>
  );
}
