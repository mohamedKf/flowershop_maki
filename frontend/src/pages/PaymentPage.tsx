import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreditCard, Wallet, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatRub } from '@/lib/utils';

export default function PaymentPage() {
  const { number } = useParams<{ number: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [method, setMethod] = useState<'sberbank' | 'cash'>('sberbank');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!number) return;
    api.get<Order>(`/orders/${number}/`).then((r) => setOrder(r.data)).catch(() => navigate('/'));
  }, [number, navigate]);

  if (!order) return <div className="container py-20 text-center text-muted-foreground">Загрузка...</div>;

  const pay = async () => {
    setPaying(true);
    setError(null);
    try {
      const res = await api.post<{ payment_url?: string; method?: string }>(
        `/orders/${order.number}/pay/`,
        { method }
      );
      if (res.data.payment_url) {
        // Redirect to Sberbank
        window.location.href = res.data.payment_url;
      } else {
        // Cash on delivery — just show success
        navigate(`/orders/${order.number}?paid=cash`);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка оплаты');
      setPaying(false);
    }
  };

  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="font-display text-4xl mb-2">Оплата заказа</h1>
      <p className="text-muted-foreground mb-8">№ {order.number}</p>

      <Card className="p-6 mb-6">
        <div className="flex justify-between items-baseline">
          <span className="text-muted-foreground">К оплате</span>
          <span className="font-display text-3xl">{formatRub(order.total)}</span>
        </div>
      </Card>

      <h2 className="font-display text-xl mb-4">Способ оплаты</h2>
      <div className="space-y-3 mb-6">
        <button
          onClick={() => setMethod('sberbank')}
          className={`w-full rounded-2xl border-2 p-5 flex items-center gap-4 text-left transition-all ${
            method === 'sberbank' ? 'border-primary bg-blush-50' : 'border-blush-100 hover:border-blush-200'
          }`}
        >
          <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-green-700" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Банковской картой</div>
            <div className="text-xs text-muted-foreground">Через Сбербанк · мгновенная оплата</div>
          </div>
        </button>

        <button
          onClick={() => setMethod('cash')}
          className={`w-full rounded-2xl border-2 p-5 flex items-center gap-4 text-left transition-all ${
            method === 'cash' ? 'border-primary bg-blush-50' : 'border-blush-100 hover:border-blush-200'
          }`}
        >
          <div className="h-12 w-12 rounded-xl bg-cream-100 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-blush-700" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Наличными при получении</div>
            <div className="text-xs text-muted-foreground">Оплата курьеру при доставке</div>
          </div>
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{error}</div>}

      <Button size="lg" className="w-full" onClick={pay} disabled={paying}>
        {paying ? 'Перенаправление...' : (
          <>{method === 'sberbank' ? 'Перейти к оплате' : 'Подтвердить заказ'}<ArrowRight className="ml-2 h-4 w-4" /></>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Оплачивая, вы соглашаетесь с условиями обработки заказа
      </p>
    </div>
  );
}
