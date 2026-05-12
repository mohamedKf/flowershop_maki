import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import type { Flower } from '@/lib/types';
import { formatRub } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Minus, Plus } from 'lucide-react';

export default function FlowerDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const { user } = useAuth();
  const [f, setF] = useState<Flower | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get<Flower>(`/flowers/${id}/`).then((r) => setF(r.data));
  }, [id]);

  if (!f) {
    return (
      <div className="container py-32 text-center text-ink-muted text-sm tracking-[0.3em] uppercase">
        Загрузка...
      </div>
    );
  }

  const tier = (f.discount_tiers || [])
    .filter((t) => qty >= t.min_quantity)
    .sort((a, b) => b.min_quantity - a.min_quantity)[0];

  const unitPrice = parseFloat(f.base_price);
  const effectivePrice = tier
    ? unitPrice * (parseFloat(tier.percent) / 100)
    : unitPrice;
  const total = effectivePrice * qty;

  const handleAdd = async () => {
    if (!user) {
      nav('/login');
      return;
    }
    setAdding(true);
    setErr('');
    try {
      await add(f.id, qty);
      nav('/cart');
    } catch (e: any) {
      const data = e?.response?.data;
      let msg = 'Не удалось добавить в корзину';
      if (typeof data === 'string') msg = data;
      else if (data?.detail) msg = data.detail;
      else if (data && typeof data === 'object') {
        // DRF validation errors come as {field: ["message"]}
        const fieldErrors = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('; ');
        if (fieldErrors) msg = fieldErrors;
      }
      setErr(msg);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container py-16 md:py-24">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-bg-stage2">
          {f.photo ? (
            <img
              src={f.photo}
              alt={f.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full" />
          )}
          {f.is_featured && (
            <span className="absolute top-5 left-5 bg-red text-white px-3 py-1 text-[10px] font-semibold tracking-[0.25em] uppercase">
              Хит
            </span>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="text-[11px] tracking-[0.3em] uppercase text-red mb-3">
            {f.category_name}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-ink-primary mb-6 leading-none">
            {f.name}
          </h1>

          {f.description && (
            <p className="text-ink-body text-base leading-[1.85] mb-10 max-w-md">
              {f.description}
            </p>
          )}

          {/* Quantity */}
          <div className="mb-8">
            <div className="text-[11px] tracking-[0.25em] uppercase text-ink-muted mb-3">
              Количество
            </div>
            <div className="inline-flex items-center border border-rule">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-12 h-12 flex items-center justify-center hover:bg-bg-elevated transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value || '1')))}
                className="w-20 h-12 bg-transparent text-center text-ink-primary font-display text-xl"
              />
              <button
                onClick={() => setQty(qty + 1)}
                className="w-12 h-12 flex items-center justify-center hover:bg-bg-elevated transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {tier && (
              <div className="mt-3 text-xs text-red tracking-[0.18em] uppercase">
                Скидка от {tier.min_quantity} шт. — {tier.percent}% от цены
              </div>
            )}
          </div>

          {/* Price */}
          <div className="border-t border-b border-rule py-6 mb-8 flex items-baseline justify-between">
            <span className="text-[11px] tracking-[0.3em] uppercase text-ink-muted">
              Итого
            </span>
            <span className="font-display text-4xl text-red">
              {formatRub(total)}
            </span>
          </div>

          {f.is_out_of_stock ? (
            <div className="px-6 py-4 border border-rule text-ink-muted text-sm tracking-[0.2em] uppercase text-center">
              Нет в наличии
            </div>
          ) : user && user.role !== 'customer' ? (
            <div className="px-6 py-4 border border-rule text-ink-muted text-sm tracking-[0.2em] uppercase text-center">
              Корзина доступна только клиентам
            </div>
          ) : (
            <Button
              onClick={handleAdd}
              disabled={adding}
              size="lg"
              className="w-full"
            >
              {adding ? 'Добавляем...' : 'В корзину'}
            </Button>
          )}

          {err && (
            <div className="mt-4 text-sm text-red border border-red/40 px-4 py-3">
              {err}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
