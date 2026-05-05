import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import api from '@/lib/api';
import { Cart } from '@/lib/types';

// For demo purposes we use a fixed shop slug. In production: detect from URL/subdomain.
export const ACTIVE_SHOP_SLUG = 'flowery';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (flowerId: number, sizeId?: number | null, quantity?: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Cart>(`/cart/?shop=${ACTIVE_SHOP_SLUG}`);
      setCart(res.data);
    } catch (e) {
      // ignore — cart might not exist yet for guest
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addItem = async (flowerId: number, sizeId?: number | null, quantity: number = 1) => {
    await api.post('/cart/items/', {
      shop: ACTIVE_SHOP_SLUG,
      flower_id: flowerId,
      size_id: sizeId || null,
      quantity,
    });
    await refresh();
  };

  const removeItem = async (itemId: number) => {
    await api.delete(`/cart/items/${itemId}/`);
    await refresh();
  };

  const updateItem = async (itemId: number, quantity: number) => {
    await api.patch(`/cart/items/${itemId}/`, { quantity });
    await refresh();
  };

  const clearCart = async () => {
    await api.delete(`/cart/?shop=${ACTIVE_SHOP_SLUG}`);
    await refresh();
  };

  return (
    <CartContext.Provider value={{ cart, loading, refresh, addItem, removeItem, updateItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
