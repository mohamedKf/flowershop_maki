import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';
import { Shop } from '@/lib/types';
import { ACTIVE_SHOP_SLUG } from '@/contexts/CartContext';

interface ShopContextType {
  shop: Shop | null;
  refresh: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType>({ shop: null, refresh: async () => {} });

export function ShopProvider({ children }: { children: ReactNode }) {
  const [shop, setShop] = useState<Shop | null>(null);

  const refresh = async () => {
    try {
      const r = await api.get<Shop>(`/shops/${ACTIVE_SHOP_SLUG}/`);
      setShop(r.data);
    } catch (e) {
      // shop might not exist yet
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <ShopContext.Provider value={{ shop, refresh }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  return useContext(ShopContext);
}
