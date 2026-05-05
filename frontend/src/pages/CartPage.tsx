import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatRub } from '@/lib/utils';

export default function CartPage() {
  const { cart, loading, removeItem, updateItem } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return <div className="container py-20 text-center text-muted-foreground">Загрузка...</div>;
  }

  if (!cart || cart.item_count === 0) {
    return (
      <div className="container py-24 text-center">
        <div className="h-24 w-24 mx-auto rounded-full bg-blush-50 flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-blush-400" />
        </div>
        <h1 className="font-display text-3xl mb-3">Корзина пуста</h1>
        <p className="text-muted-foreground mb-8">Самое время выбрать что-нибудь красивое</p>
        <Link to="/catalog">
          <Button size="lg">К каталогу</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="font-display text-4xl mb-8">Ваша корзина</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => (
            <Card key={item.id} className="p-4 flex gap-4 items-center">
              <div className="h-20 w-20 rounded-xl bg-blush-50 overflow-hidden flex-shrink-0">
                {item.flower_photo ? (
                  <img src={item.flower_photo} alt={item.flower_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl text-blush-300">❀</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg truncate">{item.flower_name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.is_custom ? `Свой букет: ${item.stems} шт` : item.size_label}
                </div>
                <div className="font-medium mt-1">{formatRub(item.line_total)}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="h-8 w-8 rounded-full border border-blush-200 hover:bg-blush-50 flex items-center justify-center"
                  onClick={() => item.quantity > 1 && updateItem(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  aria-label="Уменьшить"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  className="h-8 w-8 rounded-full border border-blush-200 hover:bg-blush-50 flex items-center justify-center"
                  onClick={() => updateItem(item.id, item.quantity + 1)}
                  aria-label="Увеличить"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <button
                className="text-muted-foreground hover:text-destructive p-2"
                onClick={() => removeItem(item.id)}
                aria-label="Удалить"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h2 className="font-display text-xl mb-4">Итого</h2>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Товары ({cart.item_count})</span>
              <span>{formatRub(cart.total)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4 pb-4 border-b border-blush-100">
              <span className="text-muted-foreground">Доставка</span>
              <span className="text-muted-foreground">рассчитается далее</span>
            </div>
            <div className="flex justify-between items-baseline mb-6">
              <span className="font-medium">К оплате</span>
              <span className="font-display text-2xl">{formatRub(cart.total)}</span>
            </div>
            <Button size="lg" className="w-full" onClick={() => navigate('/checkout')}>
              Оформить заказ <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Link to="/catalog" className="block text-center text-sm text-muted-foreground hover:text-foreground mt-4">
              Продолжить покупки
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
