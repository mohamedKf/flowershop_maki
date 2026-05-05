import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Flower } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { formatRub } from '@/lib/utils';

export default function FlowerCard({ flower }: { flower: Flower }) {
  return (
    <Link
      to={`/flowers/${flower.id}`}
      className="group relative bg-white rounded-2xl overflow-hidden border border-blush-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className="aspect-[4/5] overflow-hidden bg-blush-50 relative">
        {flower.photo ? (
          <img
            src={flower.photo}
            alt={flower.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blush-100 to-cream-100">
            <span className="font-display text-3xl text-blush-300">❀</span>
          </div>
        )}
        {flower.is_featured && (
          <Badge className="absolute top-3 left-3">Хит</Badge>
        )}
        {flower.is_out_of_stock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Badge variant="outline">Нет в наличии</Badge>
          </div>
        )}
        <button
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.preventDefault(); /* TODO: favorites */ }}
          aria-label="В избранное"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        <div className="text-xs text-blush-500 font-medium uppercase tracking-wide mb-1">
          {flower.category_name}
        </div>
        <div className="font-display text-lg leading-snug mb-2">{flower.name}</div>
        <div className="flex items-baseline justify-between">
          <div className="font-display text-xl">
            {formatRub(flower.base_price)}
            <span className="text-xs text-muted-foreground font-sans ml-1">/ шт</span>
          </div>
          {flower.is_low_stock && !flower.is_out_of_stock && (
            <Badge variant="outline" className="text-amber-700 border-amber-300">
              Мало
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
