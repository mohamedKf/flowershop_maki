import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Truck, Heart, Clock } from 'lucide-react';
import api from '@/lib/api';
import { Flower, Promotion, Category } from '@/lib/types';
import { ACTIVE_SHOP_SLUG } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FlowerCard from '@/components/catalog/FlowerCard';

export default function HomePage() {
  const [featured, setFeatured] = useState<Flower[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get<Flower[]>(`/shops/${ACTIVE_SHOP_SLUG}/flowers/?featured=1`)
      .then((r) => setFeatured(r.data.slice(0, 6)))
      .catch(() => {});
    api.get<Promotion[]>(`/shops/${ACTIVE_SHOP_SLUG}/promotions/`)
      .then((r) => setPromotions(r.data))
      .catch(() => {});
    api.get<Category[]>(`/shops/${ACTIVE_SHOP_SLUG}/categories/`)
      .then((r) => setCategories(r.data))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream-50 via-blush-50 to-blush-100">
        <div className="absolute top-1/4 -right-20 h-96 w-96 rounded-full bg-blush-200/40 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-96 w-96 rounded-full bg-cream-100/60 blur-3xl" />

        <div className="container relative py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <Badge variant="secondary" className="mb-6">
              <Sparkles className="h-3 w-3 mr-1.5" />
              Свежая весенняя коллекция
            </Badge>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6">
              Букеты, что
              <br />
              <span className="italic text-blush-600">оживают</span> в ваших
              <br />
              руках
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
              Авторские композиции из свежесрезанных цветов. Создаём с любовью,
              доставляем за 2 часа по Анапе.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/catalog">
                <Button size="lg">
                  Смотреть каталог <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/custom-bouquet">
                <Button size="lg" variant="outline">Свой букет</Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-blush-200/50">
              <Stat label="Доставка" value="2 ч" />
              <Stat label="Букетов" value="5к+" />
              <Stat label="Рейтинг" value="4.9★" />
            </div>
          </div>

          <div className="relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=1000"
              alt="Букет"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur rounded-2xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blush-100 flex items-center justify-center">
                <Heart className="h-5 w-5 text-blush-600 fill-blush-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Только сегодня</div>
                <div className="text-sm font-medium">Бесплатная открытка с каждым букетом</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROMOTIONS */}
      {promotions.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
              <div>
                <Badge variant="secondary" className="mb-3">Акции</Badge>
                <h2 className="font-display text-3xl md:text-4xl">Сейчас выгодно</h2>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {promotions.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl bg-blush-50 p-8 border border-blush-100 hover:shadow-lg transition-all"
                >
                  {p.badge_text && (
                    <Badge className="mb-4">{p.badge_text}</Badge>
                  )}
                  <h3 className="font-display text-2xl mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{p.subtitle || p.description}</p>
                  {p.promo_code && (
                    <div className="inline-block bg-white border border-dashed border-blush-300 rounded-lg px-3 py-1.5 text-sm font-mono">
                      {p.promo_code}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="py-16 bg-cream-50">
          <div className="container">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-3">Категории</Badge>
              <h2 className="font-display text-3xl md:text-4xl">Выберите по настроению</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/catalog?category=${cat.id}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-blush-100 bg-white hover:shadow-lg transition-all"
                >
                  {cat.photo ? (
                    <img src={cat.photo} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blush-100 to-blush-200" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-display text-xl">{cat.name}</h3>
                    <p className="text-xs text-white/80">{cat.flower_count} цветов</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED FLOWERS */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <Badge variant="secondary" className="mb-3">Хиты</Badge>
              <h2 className="font-display text-3xl md:text-4xl">Любимые букеты</h2>
            </div>
            <Link to="/catalog" className="text-sm text-blush-600 hover:text-blush-700 inline-flex items-center gap-1 font-medium">
              Весь каталог <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {featured.map((f) => <FlowerCard key={f.id} flower={f} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Скоро здесь будут лучшие букеты!
            </div>
          )}
        </div>
      </section>

      {/* WHY US */}
      <section className="py-16 bg-blush-50/40">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <Feature
              icon={<Truck className="h-6 w-6" />}
              title="Доставка за 2 часа"
              description="Курьер привезёт свежий букет в течение 2 часов по Анапе"
            />
            <Feature
              icon={<Sparkles className="h-6 w-6" />}
              title="Только свежие цветы"
              description="Прямые поставки из Голландии и Эквадора каждые 2 дня"
            />
            <Feature
              icon={<Clock className="h-6 w-6" />}
              title="Работаем 24/7"
              description="Принимаем заказы круглосуточно, выполняем в рабочие часы"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-3xl">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="h-14 w-14 rounded-full bg-white border border-blush-200 flex items-center justify-center text-blush-600 mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="font-display text-xl mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
