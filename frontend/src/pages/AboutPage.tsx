import { Heart, Sparkles, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useShop } from '@/contexts/ShopContext';

export default function AboutPage() {
  const { shop } = useShop();
  const shopName = shop?.name || 'Цветочная';
  const cityTag = shop?.address?.split(',')[0]?.trim() || '';

  return (
    <div>
      <div className="bg-gradient-to-br from-cream-50 to-blush-50 py-20">
        <div className="container max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4">О нас</Badge>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight mb-6">
            {shopName} — это <span className="italic text-blush-600">истории</span>,
            рассказанные лепестками
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Мы создаём авторские букеты с 2013 года. Для нас цветы — это не товар,
            а способ передать чувства, которые сложно выразить словами.
          </p>
        </div>
      </div>

      <div className="container py-16 max-w-3xl">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Stat label="Лет на рынке" value="12" />
          <Stat label="Букетов создано" value="50 000+" />
          <Stat label="Город доставки" value={cityTag || '—'} />
        </div>

        <div className="prose max-w-none mb-16">
          <h2 className="font-display text-3xl mb-4">Как мы работаем</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Каждое утро наши флористы лично выбирают самые свежие цветы у проверенных
            поставщиков из Голландии, Эквадора и местных оранжерей. Мы не работаем с
            оптовыми базами — только прямые поставки.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Букеты собираются вручную в нашей мастерской. Никаких шаблонов — каждая
            композиция уникальна и создаётся с учётом ваших пожеланий.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="h-14 w-14 mx-auto rounded-full bg-blush-100 flex items-center justify-center text-blush-600 mb-4">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl mb-2">С любовью</h3>
            <p className="text-sm text-muted-foreground">
              Каждый букет — маленькое произведение искусства
            </p>
          </div>
          <div className="text-center p-6">
            <div className="h-14 w-14 mx-auto rounded-full bg-blush-100 flex items-center justify-center text-blush-600 mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl mb-2">Только свежие</h3>
            <p className="text-sm text-muted-foreground">
              Прямые поставки от лучших мировых производителей
            </p>
          </div>
          <div className="text-center p-6">
            <div className="h-14 w-14 mx-auto rounded-full bg-blush-100 flex items-center justify-center text-blush-600 mb-4">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl mb-2">Быстро</h3>
            <p className="text-sm text-muted-foreground">
              {cityTag ? `Доставка по городу ${cityTag} за 2 часа` : 'Быстрая доставка по городу'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-5xl text-blush-600 mb-2">{value}</div>
      <div className="text-sm uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
