import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingBag, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { Flower } from '@/lib/types';
import { ACTIVE_SHOP_SLUG, useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRub } from '@/lib/utils';

interface BouquetSelection { [flowerId: number]: number; }

export default function CustomBouquetPage() {
  const navigate = useNavigate();
  const { refresh } = useCart();
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [selection, setSelection] = useState<BouquetSelection>({});
  const [quote, setQuote] = useState<{ total: string } | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get<Flower[]>(`/shops/${ACTIVE_SHOP_SLUG}/flowers/?available_for_custom=1`)
      .then((r) => setFlowers(r.data.filter((f) => !f.is_out_of_stock)))
      .catch(() => {});
  }, []);

  // Get quote whenever selection changes
  useEffect(() => {
    const items = Object.entries(selection)
      .filter(([_, q]) => q > 0)
      .map(([id, q]) => ({ flower_id: parseInt(id), quantity: q }));
    if (items.length === 0) {
      setQuote(null);
      return;
    }
    const ctrl = new AbortController();
    api.post<{ total: string }>('/custom-bouquet/quote/', {
      shop: ACTIVE_SHOP_SLUG, items,
    }, { signal: ctrl.signal })
      .then((r) => setQuote(r.data))
      .catch(() => {});
    return () => ctrl.abort();
  }, [selection]);

  const setQty = (flowerId: number, qty: number) => {
    setSelection((s) => ({ ...s, [flowerId]: Math.max(0, qty) }));
  };

  const totalStems = Object.values(selection).reduce((sum, n) => sum + n, 0);

  const addToCart = async () => {
    const items = Object.entries(selection)
      .filter(([_, q]) => q > 0)
      .map(([id, q]) => ({ flower_id: parseInt(id), quantity: q }));
    if (items.length === 0) return;
    setAdding(true);
    try {
      await api.post('/custom-bouquet/add/', { shop: ACTIVE_SHOP_SLUG, items });
      await refresh();
      navigate('/cart');
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-br from-cream-50 to-blush-50 py-16">
        <div className="container text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1.5" />
            Свой букет
          </Badge>
          <h1 className="font-display text-4xl md:text-6xl tracking-tight mb-4">
            Соберите свой <span className="italic text-blush-600">идеальный</span> букет
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Выбирайте любимые цветы, регулируйте количество — мы соберём для вас уникальную композицию.
          </p>
        </div>
      </div>

      <div className="container py-12 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="font-display text-2xl mb-6">Доступные цветы</h2>
          {flowers.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Загрузка...</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {flowers.map((f) => {
                const qty = selection[f.id] || 0;
                return (
                  <Card key={f.id} className="overflow-hidden">
                    <div className="flex gap-3 p-3">
                      <div className="h-20 w-20 rounded-xl bg-blush-50 overflow-hidden flex-shrink-0">
                        {f.photo ? (
                          <img src={f.photo} alt={f.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl text-blush-300">❀</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{f.name}</div>
                        <div className="text-xs text-muted-foreground mb-2">{f.category_name}</div>
                        <div className="text-sm font-medium">{formatRub(f.base_price)} / шт</div>
                      </div>
                    </div>
                    <div className="border-t border-blush-100 p-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setQty(f.id, qty - 1)}
                        disabled={qty === 0}
                        className="h-8 w-8 rounded-full border border-blush-200 hover:bg-blush-50 flex items-center justify-center disabled:opacity-40"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={f.stock}
                        value={qty}
                        onChange={(e) => setQty(f.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center border border-blush-100 rounded-lg py-1 text-sm"
                      />
                      <button
                        onClick={() => setQty(f.id, qty + 1)}
                        disabled={qty >= f.stock}
                        className="h-8 w-8 rounded-full border border-blush-200 hover:bg-blush-50 flex items-center justify-center disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <Card className="p-6 sticky top-24">
            <h2 className="font-display text-xl mb-4">Ваш букет</h2>

            {totalStems === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Добавьте цветы, чтобы увидеть итоговую цену
              </p>
            ) : (
              <>
                <div className="space-y-2 mb-4 text-sm max-h-60 overflow-y-auto">
                  {Object.entries(selection)
                    .filter(([_, q]) => q > 0)
                    .map(([id, q]) => {
                      const f = flowers.find((fl) => fl.id === parseInt(id));
                      if (!f) return null;
                      return (
                        <div key={id} className="flex justify-between gap-4">
                          <span className="truncate">{f.name}</span>
                          <span className="text-muted-foreground whitespace-nowrap">× {q}</span>
                        </div>
                      );
                    })}
                </div>
                <div className="pt-4 border-t border-blush-100">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Всего стеблей</span>
                    <span>{totalStems}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium">Итого</span>
                    <span className="font-display text-2xl">
                      {quote ? formatRub(quote.total) : '...'}
                    </span>
                  </div>
                </div>
                <Button size="lg" className="w-full mt-4" onClick={addToCart} disabled={adding}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {adding ? 'Добавляем...' : 'В корзину'}
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
