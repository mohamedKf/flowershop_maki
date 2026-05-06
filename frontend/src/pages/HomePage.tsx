import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Flower, Category, Promotion } from '@/lib/types';
import { listFrom, formatRub } from '@/lib/utils';
import { useShop } from '@/contexts/ShopContext';
import { Petals } from '@/components/Petals';

export default function HomePage() {
  const { shop, extras } = useShop();
  const [featured, setFeatured] = useState<Flower[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [promo, setPromo] = useState<Promotion | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/shops/flowery/flowers/?featured=1');
        setFeatured(listFrom<Flower>(r.data).slice(0, 6));
      } catch {}
      try {
        const r = await api.get('/shops/flowery/categories/');
        setCats(listFrom<Category>(r.data).slice(0, 5));
      } catch {}
      try {
        const r = await api.get('/shops/flowery/promotions/');
        const list = listFrom<Promotion>(r.data).filter((p) => p.is_featured);
        if (list.length) setPromo(list[0]);
      } catch {}
    })();
  }, []);

  return (
    <div className="bg-bg-base text-white">
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative w-full overflow-hidden"
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(ellipse at 70% 30%, #2a0408 0%, #0a0203 55%, #000 100%)',
        }}
      >
        {/* Film grain colored vignettes */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 20% 80%, rgba(200,16,46,0.12), transparent 50%), radial-gradient(circle at 90% 10%, rgba(200,16,46,0.08), transparent 40%)',
          }}
        />

        {/* Giant outlined "маки" whisper */}
        <div
          aria-hidden
          className="brand-whisper absolute leading-[0.85] z-[1]"
          style={{
            bottom: '-20px',
            left: '80px',
            fontSize: 'clamp(180px, 26vw, 360px)',
            letterSpacing: '-0.04em',
          }}
        >
          маки
        </div>

        {/* Falling petals */}
        <Petals />

        {/* Left vertical rail */}
        <div className="absolute left-0 top-0 bottom-0 w-20 border-r border-rule z-[4] flex flex-col items-center justify-between py-10 hidden md:flex">
          <Link to="/" className="font-serif italic text-[22px] text-white">
            М
          </Link>
          <div
            className="text-[11px] font-medium tracking-[0.5em] uppercase text-ink-muted whitespace-nowrap"
            style={{ transform: 'rotate(-90deg)' }}
          >
            Ателье — С {extras.establishedYear}
          </div>
          <div className="flex flex-col gap-[18px] items-center">
            {extras.social.instagram && (
              <a
                href={extras.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-semibold tracking-[0.15em] text-ink-faint hover:text-red transition-colors"
              >
                IG
              </a>
            )}
            {extras.social.telegram && (
              <a
                href={extras.social.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-semibold tracking-[0.15em] text-ink-faint hover:text-red transition-colors"
              >
                TG
              </a>
            )}
            {extras.social.vk && (
              <a
                href={extras.social.vk}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-semibold tracking-[0.15em] text-ink-faint hover:text-red transition-colors"
              >
                VK
              </a>
            )}
          </div>
        </div>

        {/* Top-right meta */}
        <div className="absolute top-10 right-14 text-right z-[4] hidden lg:block leading-[1.8]">
          <div className="text-[11px] font-medium tracking-[0.3em] uppercase text-red">
            Открыто · сейчас
          </div>
          <div className="text-[11px] font-medium tracking-[0.3em] uppercase text-ink-muted">
            {extras.deliveryTimeText}
          </div>
        </div>

        {/* Right vertical nav */}
        <nav className="absolute right-14 top-1/2 -translate-y-1/2 z-[4] hidden lg:flex flex-col gap-[22px] items-end">
          <Link
            to="/catalog"
            className="flex items-center justify-end gap-3 text-xs font-medium tracking-[0.28em] uppercase text-red"
          >
            <span className="block w-6 h-px bg-red" />
            Букеты
          </Link>
          {[
            { to: '/custom-bouquet', label: 'Свой букет' },
            { to: '/about', label: 'О нас' },
          ].map((it, i) => (
            <Link
              key={i}
              to={it.to}
              className="group flex items-center justify-end gap-3 text-xs font-medium tracking-[0.28em] uppercase text-ink-muted hover:text-ink-secondary transition-colors"
            >
              <span className="block w-0 h-px bg-red transition-all group-hover:w-6" />
              {it.label}
            </Link>
          ))}
        </nav>

        {/* Center copy */}
        <div
          className="absolute z-[3] max-w-[620px] px-6"
          style={{
            left: 'clamp(24px, 8vw, 130px)',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <div className="eyebrow mb-6">{extras.hero.eyebrow}</div>
          <h1
            className="font-display font-normal m-0"
            style={{
              fontSize: 'clamp(56px, 8.5vw, 124px)',
              lineHeight: 0.98,
              letterSpacing: '-0.015em',
            }}
          >
            <span className="block text-white">{extras.hero.line1}</span>
            <span className="block font-serif italic text-ink-secondary">
              {extras.hero.line2}
            </span>
            <span className="block text-red">{extras.hero.line3}</span>
          </h1>
          <p
            className="mt-9 text-base font-light text-ink-body max-w-[440px]"
            style={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: extras.hero.lede }}
          />
          <div className="mt-11 flex flex-wrap gap-8 items-center">
            <Link to="/catalog" className="btn-red">
              Заказать букет
            </Link>
            <Link
              to="/catalog"
              className="text-xs font-medium tracking-[0.28em] uppercase text-ink-body hover:text-white transition-colors"
            >
              Посмотреть каталог{' '}
              <span className="text-red ml-1">→</span>
            </Link>
          </div>
        </div>

        {/* Mobile fallback CTA at bottom */}
        <div className="absolute bottom-8 left-6 right-6 z-[5] flex md:hidden flex-col items-start gap-4">
          <Link to="/catalog" className="btn-red">
            Заказать букет
          </Link>
        </div>
      </section>

      {/* ─── FEATURED ────────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="border-t border-rule py-24 md:py-32 relative">
          <div className="container">
            <div className="flex justify-between items-end mb-16 flex-wrap gap-6">
              <div>
                <div className="eyebrow mb-4">— Глава вторая</div>
                <h2 className="section-title">
                  Тщательный <em>отбор</em>
                </h2>
              </div>
              <Link
                to="/catalog"
                className="text-[11px] font-medium tracking-[0.28em] uppercase text-ink-body hover:text-red border-b border-rule hover:border-red transition-colors pb-1"
              >
                Весь каталог →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
              {featured.map((f) => (
                <ProductCard key={f.id} f={f} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── STORY ────────────────────────────────────────────────────────── */}
      <section className="border-t border-rule py-24 md:py-32 relative">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1502977249166-824b3a8a4d6d?w=1200"
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: 'contrast(1.1) brightness(0.9)' }}
              />
              <div className="absolute inset-4 border border-red pointer-events-none" />
              <div
                className="absolute -bottom-10 -right-6 font-serif italic z-10 leading-none"
                style={{
                  fontSize: '200px',
                  color: 'transparent',
                  WebkitTextStroke: '1px #c8102e',
                }}
              >
                III
              </div>
            </div>
            <div>
              <div className="eyebrow mb-4">— Глава третья</div>
              <h2 className="section-title mb-8">
                Маленькое <em>ателье</em>
                <br />в самом сердце<br />
                {extras.city}
              </h2>
              <p className="text-base text-ink-body leading-[1.85] mb-5 max-w-md">
                Студия {shop?.name || 'Маки'} открылась в {extras.establishedYear} году&nbsp;—
                маленькая мастерская с большой любовью к&nbsp;цветам. Здесь
                работают флористы, которые понимают, что букет&nbsp;— это не
                товар, а способ говорить о&nbsp;важном без слов.
              </p>
              <p className="text-base text-ink-body leading-[1.85] mb-12 max-w-md">
                Каждое утро мы лично выбираем самые свежие цветы у&nbsp;проверенных
                поставщиков. Никаких шаблонов, никаких оптовых баз.
              </p>

              <div className="flex gap-14 pt-9 border-t border-rule">
                <div>
                  <div className="font-display text-5xl text-red leading-none mb-2">
                    {new Date().getFullYear() - parseInt(extras.establishedYear)}+
                  </div>
                  <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-ink-muted">
                    Лет в {extras.city}
                  </div>
                </div>
                <div>
                  <div className="font-display text-5xl text-red leading-none mb-2">
                    50K
                  </div>
                  <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-ink-muted">
                    Букетов
                  </div>
                </div>
                <div>
                  <div className="font-display text-5xl text-red leading-none mb-2">
                    90
                  </div>
                  <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-ink-muted">
                    Минут
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ──────────────────────────────────────────────────── */}
      {cats.length > 0 && (
        <section className="border-t border-rule py-24 md:py-32">
          <div className="container">
            <div className="mb-16">
              <div className="eyebrow mb-4">— Глава четвёртая</div>
              <h2 className="section-title">
                Каждой главе — <em>свой цветок</em>
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr] gap-6">
              {cats.map((c, i) => (
                <Link
                  key={c.id}
                  to={`/catalog?category=${c.id}`}
                  className={`relative overflow-hidden group block ${
                    i === 0 ? 'col-span-2 lg:col-span-1 lg:row-span-2' : ''
                  }`}
                  style={{ aspectRatio: i === 0 ? '1/1.3' : '4/5' }}
                >
                  {c.photo ? (
                    <img
                      src={c.photo}
                      alt={c.name}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                      style={{ filter: 'brightness(0.55)' }}
                    />
                  ) : (
                    <div className="w-full h-full bg-bg-stage1" />
                  )}
                  <div className="absolute inset-0 p-10 flex flex-col justify-end bg-gradient-to-t from-bg-base/95 to-transparent">
                    <h3 className="font-display text-3xl md:text-4xl text-white mb-2 leading-none">
                      {c.name}
                    </h3>
                    <div className="text-[11px] font-medium tracking-[0.28em] uppercase text-red flex items-center gap-3">
                      {c.flower_count} {pluralFlowers(c.flower_count)}
                      <span className="transition-transform group-hover:translate-x-2">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── PROMO ────────────────────────────────────────────────────────── */}
      {promo && (
        <section
          className="border-t border-b border-red py-28 text-center relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, #8b0000, #c8102e, #8b0000)',
          }}
        >
          <div
            className="absolute inset-0 opacity-10 mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
            }}
          />
          <div className="container relative">
            <div className="text-[11px] font-medium tracking-[0.4em] uppercase text-white/85 mb-5">
              — {promo.subtitle || 'Специальное предложение'} —
            </div>
            <h2 className="font-display text-5xl md:text-7xl text-white mb-7 leading-none">
              {promo.title}
            </h2>
            {promo.description && (
              <p className="max-w-xl mx-auto text-white/90 text-base leading-[1.7] mb-9">
                {promo.description}
              </p>
            )}
            {promo.promo_code && (
              <div className="inline-block bg-bg-base text-red font-display text-3xl py-4 px-10 tracking-[0.2em]">
                {promo.promo_code}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductCard({ f }: { f: Flower }) {
  return (
    <Link to={`/flowers/${f.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden mb-6 bg-bg-stage2">
        {f.photo ? (
          <img
            src={f.photo}
            alt={f.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
            style={{ filter: 'brightness(0.85)' }}
          />
        ) : (
          <div className="w-full h-full" />
        )}
        {f.is_featured && (
          <span className="absolute top-4 left-4 bg-red text-white px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.25em] uppercase z-10">
            Хит
          </span>
        )}
      </div>
      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="text-[10px] font-medium tracking-[0.28em] uppercase text-red mb-2">
            {f.category_name}
          </div>
          <h3 className="font-display text-2xl text-white leading-tight group-hover:text-red transition-colors">
            {f.name}
          </h3>
        </div>
        <div className="font-display text-xl text-red text-right whitespace-nowrap">
          {formatRub(f.base_price)}
          <small className="block font-sans text-[10px] font-normal text-ink-faint tracking-[0.15em] mt-1">
            за стебель
          </small>
        </div>
      </div>
    </Link>
  );
}

function pluralFlowers(n: number) {
  if (n === 1) return 'цветок';
  if (n >= 2 && n <= 4) return 'цветка';
  return 'цветов';
}
