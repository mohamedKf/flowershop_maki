import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Check, Truck, Shield } from 'lucide-react';
import api from '@/lib/api';
import { Flower } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRub, cn } from '@/lib/utils';

export default function FlowerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [flower, setFlower] = useState<Flower | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<Flower>(`/flowers/${id}/`)
      .then((r) => {
        setFlower(r.data);
        if (r.data.sizes && r.data.sizes.length > 0) {
          setSelectedSizeId(r.data.sizes[0].id);
        }
      })
      .catch(() => navigate('/catalog'));
  }, [id, navigate]);

  if (!flower) {
    return <div className="container py-20 text-center text-muted-foreground">Загрузка...</div>;
  }

  const selectedSize = flower.sizes?.find((s) => s.id === selectedSizeId);

  const handleAdd = async () => {
    if (!selectedSizeId) return;
    setAdding(true);
    try {
      await addItem(flower.id, selectedSizeId, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container py-8 md:py-16">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Назад
      </button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        {/* Image */}
        <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-blush-50">
          {flower.photo ? (
            <img src={flower.photo} alt={flower.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blush-100 to-cream-100">
              <span className="font-display text-9xl text-blush-300">❀</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="text-sm text-blush-500 font-medium uppercase tracking-wide mb-2">
            {flower.category_name}
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-4">{flower.name}</h1>
          {flower.description && (
            <p className="text-muted-foreground mb-6 leading-relaxed">{flower.description}</p>
          )}

          <div className="flex items-baseline gap-3 mb-8">
            <div className="font-display text-4xl">
              {selectedSize ? formatRub(selectedSize.price) : formatRub(flower.base_price)}
            </div>
            {selectedSize && (
              <div className="text-sm text-muted-foreground">
                за {selectedSize.quantity} {pluralStems(selectedSize.quantity)}
              </div>
            )}
          </div>

          {/* Size picker */}
          {flower.sizes && flower.sizes.length > 0 && (
            <div className="mb-8">
              <div className="text-sm font-medium mb-3">Выберите количество</div>
              <div className="grid grid-cols-3 gap-2">
                {flower.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSizeId(size.id)}
                    className={cn(
                      'rounded-xl border-2 px-3 py-3 text-center transition-all',
                      selectedSizeId === size.id
                        ? 'border-primary bg-blush-50'
                        : 'border-blush-100 hover:border-blush-300'
                    )}
                  >
                    <div className="font-display text-xl">{size.quantity}</div>
                    <div className="text-xs text-muted-foreground">{pluralStems(size.quantity)}</div>
                    <div className="text-xs font-medium mt-1">{formatRub(size.price)}</div>
                  </button>
                ))}
              </div>
              {flower.discount_tiers && flower.discount_tiers.length > 0 && (
                <div className="mt-4 text-xs text-muted-foreground">
                  Скидки от количества:{' '}
                  {flower.discount_tiers.map((t) => `${t.min_quantity}+ → ${100 - parseFloat(t.percent)}% скидка`).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Add to cart */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleAdd}
            disabled={adding || flower.is_out_of_stock}
          >
            {added ? (
              <><Check className="mr-2 h-5 w-5" /> Добавлено</>
            ) : flower.is_out_of_stock ? (
              'Нет в наличии'
            ) : (
              <><ShoppingBag className="mr-2 h-5 w-5" /> Добавить в корзину</>
            )}
          </Button>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-blush-100">
            <div className="flex gap-3">
              <Truck className="h-5 w-5 text-blush-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Доставка за 2 часа</div>
                <div className="text-xs text-muted-foreground">по Анапе</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-blush-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Гарантия свежести</div>
                <div className="text-xs text-muted-foreground">7 дней</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function pluralStems(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'шт';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'шт';
  return 'шт';
}
