import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { formatRub } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

export default function PaymentPage() {
  const { number } = useParams();
  const nav = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    api.get<Order>(`/orders/${number}/`).then((r) => setOrder(r.data));
  }, [number]);

  if (!order) {
    return (
      <div className="container py-32 text-center text-ink-muted text-sm tracking-[0.3em] uppercase">
        Загрузка...
      </div>
    );
  }

  const pay = async () => {
    setPaying(true);
    // Simulate Sber payment
    setTimeout(async () => {
      try {
        await api.post(`/orders/${number}/pay/`, {});
        setPaid(true);
        setTimeout(() => nav('/account'), 2200);
      } catch {
        setPaying(false);
      }
    }, 1800);
  };

  if (paid) {
    return (
      <div className="container py-32 text-center">
        <CheckCircle2 className="w-20 h-20 text-red mx-auto mb-6" />
        <h1 className="font-display text-5xl text-ink-primary mb-4">Оплачено</h1>
        <p className="text-ink-body">Заказ № {order.number} принят в работу.</p>
      </div>
    );
  }

  return (
    <div className="container py-16 md:py-24 max-w-xl">
      <div className="eyebrow mb-4">— Оплата</div>
      <h1 className="section-title mb-12">Заказ № <em>{order.number}</em></h1>

      <div className="bg-bg-card border border-rule p-8 mb-8">
        <div className="space-y-3 mb-6">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <span className="text-ink-body">
                {it.flower_name} × {it.quantity}
              </span>
              <span className="text-ink-primary">{formatRub(it.line_total)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-rule pt-6 flex justify-between items-baseline">
          <span className="text-[11px] tracking-[0.3em] uppercase text-ink-muted">К оплате</span>
          <span className="font-display text-4xl text-red">{formatRub(order.total)}</span>
        </div>
      </div>

      <div className="bg-bg-card border border-rule p-8 mb-6">
        <div className="text-[11px] tracking-[0.3em] uppercase text-red mb-3">
          Сбербанк · картой
        </div>
        <p className="text-sm text-ink-muted">
          После нажатия кнопки откроется страница оплаты Сбербанка.
          Это демо&nbsp;— оплата проходит мгновенно.
        </p>
      </div>

      <div className="flex gap-4">
        <Button onClick={pay} disabled={paying} size="lg" className="flex-1">
          {paying ? 'Обработка...' : 'Оплатить'}
        </Button>
        <Link to="/account" className="btn-outline">Позже</Link>
      </div>
    </div>
  );
}
