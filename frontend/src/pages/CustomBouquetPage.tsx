import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { Flower } from '@/lib/types';
import { listFrom, formatRub } from '@/lib/utils';
import { SHOP_SLUG } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Minus } from 'lucide-react';

export default function CustomBouquetPage() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const { add } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    api
      .get(`/shops/${SHOP_SLUG}/flowers/?available_for_custom=1`)
      .then((r) => setFlowers(listFrom<Flower>(r.data)));
  }, []);

  const total = Object.entries(picks).reduce((s, [id, qty]) => {
    const f = flowers.find((x) => x.id === Number(id));
    return s + (f ? parseFloat(f.base_price) * qty : 0);
  }, 0);

  const totalQty = Object.values(picks).reduce((s, q) => s + q, 0);

  const submit = async () => {
    if (!user) {
      nav('/login');
      return;
    }
    for (const [id, qty] of Object.entries(picks)) {
      if (qty > 0) await add(Number(id), qty);
    }
    nav('/cart');
  };

  return (
    <div className="container py-16 md:py-24">
      <div className="mb-14">
        <div className="eyebrow mb-4">— Свой букет</div>
        <h1 className="section-title">
          Соберите <em>свой</em>
        </h1>
        <p className="mt-6 max-w-xl text-ink-body leading-[1.85]">
          Выберите цветы и количество. Наши флористы свяжут букет вручную и
          доставят в&nbsp;течение 90 минут.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mb-12">
        {flowers.map((f) => {
          const qty = picks[f.id] || 0;
          return (
            <div key={f.id}>
              <div className="relative aspect-square overflow-hidden mb-4 bg-bg-stage2">
                {f.photo && (
                  <img
                    src={f.photo}
                    alt={f.name}
                    className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.85)' }}
                  />
                )}
              </div>
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-red mb-1">
                    {f.category_name}
                  </div>
                  <h3 className="font-display text-xl text-ink-primary">{f.name}</h3>
                </div>
                <div className="text-red font-display text-lg whitespace-nowrap">
                  {formatRub(f.base_price)}
                </div>
              </div>
              <div className="flex items-center border border-rule">
                <button
                  onClick={() => setPicks({ ...picks, [f.id]: Math.max(0, qty - 1) })}
                  disabled={qty === 0}
                  className="w-10 h-10 flex items-center justify-center hover:bg-bg-elevated transition-colors disabled:opacity-30"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <div className="flex-1 h-10 flex items-center justify-center text-ink-primary font-display text-lg">
                  {qty}
                </div>
                <button
                  onClick={() => setPicks({ ...picks, [f.id]: qty + 1 })}
                  className="w-10 h-10 flex items-center justify-center hover:bg-bg-elevated transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky summary */}
      {totalQty > 0 && (
        <div className="sticky bottom-6 z-30 bg-bg-card border border-red-shadow shadow-[0_8px_32px_rgba(200,16,46,0.25)] p-6 flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-ink-muted mb-1">
              {totalQty} {totalQty === 1 ? 'цветок' : totalQty < 5 ? 'цветка' : 'цветов'} в букете
            </div>
            <div className="font-display text-3xl text-red">{formatRub(total)}</div>
          </div>
          {user && user.role !== 'customer' ? (
            <span className="text-xs tracking-[0.2em] uppercase text-ink-muted">
              Доступно клиентам
            </span>
          ) : (
            <Button onClick={submit} size="lg">Оформить букет</Button>
          )}
        </div>
      )}
    </div>
  );
}
