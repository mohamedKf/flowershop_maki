import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { Flower, Category } from '@/lib/types';
import { ACTIVE_SHOP_SLUG } from '@/contexts/CartContext';
import FlowerCard from '@/components/catalog/FlowerCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Category[]>(`/shops/${ACTIVE_SHOP_SLUG}/categories/`)
      .then((r) => setCategories(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = activeCategory
      ? `/shops/${ACTIVE_SHOP_SLUG}/flowers/?category=${activeCategory}`
      : `/shops/${ACTIVE_SHOP_SLUG}/flowers/`;
    api.get<Flower[]>(url)
      .then((r) => setFlowers(r.data))
      .catch(() => setFlowers([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const setCategory = (id: string | null) => {
    if (id) {
      setSearchParams({ category: id });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-cream-50 to-blush-50 py-16">
        <div className="container text-center">
          <Badge variant="secondary" className="mb-4">Каталог</Badge>
          <h1 className="font-display text-4xl md:text-6xl tracking-tight mb-4">
            Все наши <span className="italic text-blush-600">букеты</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Свежесрезанные цветы, авторские композиции и сезонные коллекции —
            каждый день мы создаём что-то особенное.
          </p>
        </div>
      </div>

      <div className="container py-12">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          <button
            onClick={() => setCategory(null)}
            className={cn(
              'px-5 py-2 rounded-full text-sm font-medium transition-all border',
              !activeCategory
                ? 'bg-foreground text-background border-foreground'
                : 'bg-white border-blush-200 hover:border-blush-400'
            )}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(String(cat.id))}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-all border',
                activeCategory === String(cat.id)
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-white border-blush-200 hover:border-blush-400'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Flowers grid */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Загрузка...</div>
        ) : flowers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌸</div>
            <p className="text-muted-foreground">В этой категории пока нет букетов</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {flowers.map((f) => <FlowerCard key={f.id} flower={f} />)}
          </div>
        )}
      </div>
    </div>
  );
}
