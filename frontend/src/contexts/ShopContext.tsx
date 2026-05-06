import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import api from '@/lib/api';
import type { Shop, ShopExtras } from '@/lib/types';
import { SHOP_EXTRAS } from '@/lib/shop-extras';

interface ShopCtx {
  shop: Shop | null;
  extras: ShopExtras;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<ShopCtx | undefined>(undefined);

const SHOP_SLUG = 'flowery';

export function ShopProvider({ children }: { children: ReactNode }) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const r = await api.get<Shop>(`/shops/${SHOP_SLUG}/`);
      setShop(r.data);
    } catch {
      // even if shop fails, render UI with sensible fallbacks
      setShop(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <Ctx.Provider value={{ shop, extras: SHOP_EXTRAS, loading, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useShop() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useShop must be inside ShopProvider');
  return v;
}
