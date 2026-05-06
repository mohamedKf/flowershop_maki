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

  return (
    <div className="container py-16 md:py-24">
      <div className="mb-12">
        <div className="eyebrow mb-4">— Каталог</div>
        <h1 className="section-title">
          Все наши <em>цветы</em>
        </h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-12 pb-8 border-b border-rule">
        <button
          onClick={() => {
            const p = new URLSearchParams(params);
            p.delete('category');
            setParams(p);
          }}
          className={`px-5 py-2.5 text-[11px] tracking-[0.25em] uppercase border transition-colors ${
            !activeCat
              ? 'bg-red border-red text-white'
              : 'border-rule text-ink-body hover:border-red hover:text-red'
          }`}
        >
          Все
        </button>
        {cats.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              const p = new URLSearchParams(params);
              p.set('category', String(c.id));
              setParams(p);
            }}
            className={`px-5 py-2.5 text-[11px] tracking-[0.25em] uppercase border transition-colors ${
              activeCat === String(c.id)
                ? 'bg-red border-red text-white'
                : 'border-rule text-ink-body hover:border-red hover:text-red'
            }`}
          >
            {c.name}
          </button>
        ))}
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
                  <h3 className="font-display text-2xl text-white group-hover:text-red transition-colors">
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
