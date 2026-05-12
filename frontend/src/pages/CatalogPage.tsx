import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import type { Flower, Category } from '@/lib/types';
import { listFrom, formatRub } from '@/lib/utils';
import { SHOP_SLUG } from '@/lib/config';

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const activeCat = params.get('category');

  useEffect(() => {
    api
      .get(`/shops/${SHOP_SLUG}/categories/`)
      .then((r) => setCats(listFrom<Category>(r.data)));
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = activeCat
      ? `/shops/${SHOP_SLUG}/flowers/?category=${activeCat}`
      : `/shops/${SHOP_SLUG}/flowers/`;
    api
      .get(url)
      .then((r) => setFlowers(listFrom<Flower>(r.data)))
      .finally(() => setLoading(false));
  }, [activeCat]);

  const setCategory = (id: string | null) => {
    const p = new URLSearchParams(params);
    if (id) p.set('category', id);
    else p.delete('category');
    setParams(p);
  };

  return (
    <div className="container py-10 md:py-24">
      <div className="mb-8 md:mb-12">
        <div className="eyebrow mb-4">— Каталог</div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1]">
          Все наши <em className="font-serif italic text-red">цветы</em>
        </h1>
      </div>

      {/* Category bubbles — horizontal scroll with proper edge fade */}
      <div className="mb-10 md:mb-12 pb-6 md:pb-8 border-b border-rule -mx-4 md:mx-0">
        <div className="flex gap-4 md:gap-7 overflow-x-auto scrollbar-hide pb-2 px-4 md:px-0">
          {/* "All" bubble */}
          <CategoryBubble
            label="Все"
            isAll
            active={!activeCat}
            onClick={() => setCategory(null)}
          />

          {cats.map((c) => (
            <CategoryBubble
              key={c.id}
              label={c.name}
              photo={c.photo}
              active={activeCat === String(c.id)}
              onClick={() => setCategory(String(c.id))}
            />
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-ink-muted text-sm tracking-[0.3em] uppercase">
          Загрузка...
        </div>
      ) : flowers.length === 0 ? (
        <div className="py-20 text-center text-ink-muted">Ничего не найдено</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
          {flowers.map((f) => (
            <Link key={f.id} to={`/flowers/${f.id}`} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden mb-5 bg-bg-stage2">
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
                  <span className="absolute top-4 left-4 bg-red text-white px-3 py-1 text-[10px] font-semibold tracking-[0.25em] uppercase">
                    Хит
                  </span>
                )}
                {f.is_out_of_stock && (
                  <span className="absolute top-4 right-4 bg-bg-base/90 text-ink-muted px-3 py-1 text-[10px] tracking-[0.2em] uppercase border border-rule">
                    нет в наличии
                  </span>
                )}
              </div>
              <div className="flex justify-between gap-4 items-start">
                <div>
                  <div className="text-[10px] font-medium tracking-[0.28em] uppercase text-red mb-1.5">
                    {f.category_name}
                  </div>
                  <h3 className="font-display text-2xl text-ink-primary group-hover:text-red transition-colors">
                    {f.name}
                  </h3>
                </div>
                <div className="font-display text-xl text-red whitespace-nowrap">
                  {formatRub(f.base_price)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────

interface BubbleProps {
  label: string;
  photo?: string | null;
  active: boolean;
  isAll?: boolean;
  onClick: () => void;
}

function CategoryBubble({ label, photo, active, isAll, onClick }: BubbleProps) {
  const firstLetter = label.charAt(0).toUpperCase();
  // Only treat as a real photo if it looks like a URL (starts with http or /)
  const hasPhoto =
    !!photo &&
    typeof photo === 'string' &&
    photo.trim() !== '' &&
    (photo.startsWith('http') || photo.startsWith('/'));

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex flex-col items-center gap-2 group min-w-[72px] md:min-w-[96px]"
      type="button"
    >
      <div
        className={`relative w-[68px] h-[68px] md:w-24 md:h-24 rounded-full overflow-hidden transition-all duration-300 ${
          active
            ? 'scale-105 ring-2 ring-red ring-offset-[3px] ring-offset-bg-base'
            : 'ring-1 ring-rule group-hover:ring-red'
        }`}
        style={{
          // Always have a visible background — gradient by default, overridden if photo present
          background: isAll
            ? undefined
            : 'linear-gradient(135deg, var(--red-deep), var(--red-dark))',
        }}
      >
        {isAll ? (
          // "All" bubble — outlined with text inside
          <div className="w-full h-full flex items-center justify-center bg-bg-elevated">
            <span
              className={`font-display text-base md:text-xl transition-colors ${
                active ? 'text-red' : 'text-ink-primary group-hover:text-red'
              }`}
            >
              Все
            </span>
          </div>
        ) : hasPhoto ? (
          <img
            src={photo!}
            alt={label}
            className="w-full h-full object-cover"
            style={{ filter: active ? 'brightness(0.95)' : 'brightness(0.8)' }}
            onError={(e) => {
              // If image fails to load, hide it so the gradient bg shows
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          // No-photo fallback — first letter centered on the gradient bg
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-2xl text-white">
              {firstLetter}
            </span>
          </div>
        )}
      </div>
      <span
        className={`text-[10px] md:text-[11px] tracking-[0.2em] md:tracking-[0.25em] uppercase font-medium transition-colors max-w-[80px] md:max-w-[90px] text-center leading-tight ${
          active ? 'text-red' : 'text-ink-body group-hover:text-red'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
