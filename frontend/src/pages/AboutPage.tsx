import { useShop } from '@/contexts/ShopContext';

export default function AboutPage() {
  const { shop, extras } = useShop();
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-3xl">
        <div className="eyebrow mb-4">— О студии</div>
        <h1 className="section-title mb-12">
          {shop?.name || 'Маки'} <em>— это</em>
        </h1>

        <div className="space-y-7 text-base text-ink-body leading-[1.9] mb-16">
          <p>
            Мы работаем с {extras.establishedYear} года. Маленькая студия в&nbsp;{extras.city},
            где каждый букет собирают вручную.
          </p>
          <p>
            Никаких массовых заказов с&nbsp;баз, никаких готовых наборов из&nbsp;Китая.
            Только свежие цветы, привезённые этим утром, и&nbsp;руки флористов,
            которые понимают, что цветок&nbsp;— это акт говорения.
          </p>
          <p>
            «{extras.tagline}»&nbsp;— говорил наш первый учитель. С&nbsp;тех пор мы
            стараемся, чтобы каждый букет был именно таким&nbsp;— важным.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 pt-12 border-t border-rule">
          <div>
            <div className="font-display text-5xl text-red mb-2">
              {new Date().getFullYear() - parseInt(extras.establishedYear)}+
            </div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-ink-muted">
              Лет работы
            </div>
          </div>
          <div>
            <div className="font-display text-5xl text-red mb-2">50K</div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-ink-muted">
              Букетов
            </div>
          </div>
          <div>
            <div className="font-display text-5xl text-red mb-2">90</div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-ink-muted">
              Минут доставка
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
