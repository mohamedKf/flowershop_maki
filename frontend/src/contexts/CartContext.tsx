import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import api from '@/lib/api';
import type { Cart } from '@/lib/types';
import { SHOP_SLUG } from '@/lib/config';
import { useAuth } from './AuthContext';

interface CartCtx {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  add: (flowerId: number, quantity: number) => Promise<void>;
  update: (itemId: number, quantity: number) => Promise<void>;
  remove: (itemId: number) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<CartCtx | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const r = await api.get<Cart>(`/cart/?shop=${SHOP_SLUG}`);
      setCart(r.data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async (flowerId: number, quantity: number) => {
    await api.post('/cart/items/', {
      flower: flowerId,
      flower_id: flowerId,
      quantity,
      shop: SHOP_SLUG,
      shop_slug: SHOP_SLUG,
    });
    await refresh();
  };

  const update = async (itemId: number, quantity: number) => {
    await api.patch(`/cart/items/${itemId}/`, { quantity });
    await refresh();
  };

  const remove = async (itemId: number) => {
    await api.delete(`/cart/items/${itemId}/`);
    await refresh();
  };

  const clear = async () => {
    if (!cart) return;
    for (const item of cart.items) {
      try {
        await api.delete(`/cart/items/${item.id}/`);
      } catch {}
    }
    await refresh();
  };

  const itemCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <Ctx.Provider
      value={{ cart, loading, itemCount, add, update, remove, clear, refresh }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart must be inside CartProvider');
  return v;
}
