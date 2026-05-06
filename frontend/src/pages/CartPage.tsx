import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { formatRub } from '@/lib/utils';
import { Trash2, Plus, Minus } from 'lucide-react';

export default function CartPage() {
  const { cart, update, remove, loading } = useCart();

  if (loading) {
    return (
      <div className="container py-32 text-center text-ink-muted text-sm tracking-[0.3em] uppercase">
        Загрузка...
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container py-32 text-center">
        <div className="font-display text-5xl text-white mb-6">Корзина пуста</div>
        <p className="text-ink-muted mb-10">Самое время выбрать букет.</p>
        <Link to="/catalog" className="btn-red">В каталог</Link>
      </div>
    );
  }

  return (
    <div className="container py-16 md:py-24">
      <div className="mb-12">
        <div className="eyebrow mb-4">— Корзина</div>
        <h1 className="section-title">Ваш <em>заказ</em></h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-12">
        {/* Items */}
        <div className="space-y-6">
          {cart.items.map((it) => (
            <div
              key={it.id}
              className="flex gap-6 pb-6 border-b border-rule items-center"
            >
              <div className="w-24 h-24 flex-shrink-0 bg-bg-stage2 overflow-hidden">
                {it.flower_photo && (
                  <img
                    src={it.flower_photo}
                    alt={it.flower_name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-2xl text-white mb-1 truncate">
                  {it.flower_name}
                </div>
                <div className="text-sm text-ink-muted">
                  {formatRub(it.unit_price)} × {it.quantity}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-rule">
                  <button
                    onClick={() => update(it.id, Math.max(1, it.quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-bg-elevated transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-10 text-center font-display text-base">{it.quantity}</span>
                  <button
                    onClick={() => update(it.id, it.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-bg-elevated transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => remove(it.id)}
                  className="w-8 h-8 flex items-center justify-center text-ink-muted hover:text-red transition-colors"
                  aria-label="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="font-display text-2xl text-red w-32 text-right">
                {formatRub(it.line_total)}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-bg-card border border-rule p-8 h-fit lg:sticky lg:top-32">
          <h3 className="font-display text-2xl text-white mb-6">Итого</h3>

          <div className="flex justify-between mb-3 text-ink-body">
            <span>Сумма</span>
            <span className="font-display text-white">{formatRub(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between mb-6 text-ink-muted text-sm">
            <span>Доставка</span>
            <span>при заказе</span>
          </div>

          <div className="border-t border-rule pt-6 mb-8 flex justify-between items-baseline">
            <span className="text-[11px] tracking-[0.3em] uppercase text-ink-muted">К оплате</span>
            <span className="font-display text-3xl text-red">
              {formatRub(cart.total)}
            </span>
          </div>

          <Link to="/checkout" className="btn-red w-full justify-center">
            К оформлению
          </Link>
        </div>
      </div>
    </div>
  );
}
