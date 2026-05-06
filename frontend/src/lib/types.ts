// ─── Domain types ──────────────────────────────────────────────────────────
export interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null;
  is_active: boolean;
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'customer' | 'manager' | 'worker';
  shop?: number | null;
}

export interface Category {
  id: number;
  shop: number;
  name: string;
  description: string;
  photo: string | null;
  sort_order: number;
  is_active: boolean;
  flower_count: number;
}

export interface FlowerSize {
  id: number;
  flower: number;
  quantity: number;
  label: string;
  price: string;
  is_active: boolean;
}

export interface DiscountTier {
  id: number;
  flower: number;
  min_quantity: number;
  percent: string;
}

export interface Flower {
  id: number;
  shop: number;
  category: number;
  category_name: string;
  name: string;
  description: string;
  photo: string | null;
  base_price: string;
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  available_for_custom: boolean;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  sizes?: FlowerSize[];
  discount_tiers?: DiscountTier[];
}

export interface Promotion {
  id: number;
  shop: number;
  title: string;
  subtitle: string;
  description: string;
  badge_text: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  promo_code: string;
  starts_at: string;
  ends_at: string;
  is_featured: boolean;
  is_running: boolean;
  scope: string;
}

export interface CartItem {
  id: number;
  flower: number;
  flower_name: string;
  flower_photo: string | null;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: string;
  total: string;
}

export interface OrderItem {
  id: number;
  flower_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface Order {
  id: number;
  number: string;
  status: 'pending' | 'paid' | 'processing' | 'ready' | 'delivered' | 'cancelled';
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  delivery_notes: string;
  subtotal: string;
  total: string;
  promo_code: string;
  created_at: string;
  items: OrderItem[];
}

export interface DashboardOverview {
  shop: Shop;
  revenue: { today: string; this_week: string; this_month: string };
  orders: { today: number; this_week: number; pending_payment: number };
  customers: { total: number; new_this_month: number };
  inventory: {
    total_flowers: number;
    low_stock_flowers: number;
    out_of_stock_flowers: number;
  };
  recent_orders: Array<{
    number: string;
    customer_name: string;
    total: string;
    status: string;
    created_at: string;
  }>;
}

// ─── UI-only types ─────────────────────────────────────────────────────────
export interface ShopExtras {
  // these are not stored in backend yet; kept as defaults in frontend
  city: string;
  hoursText: string;
  deliveryTimeText: string;
  tagline: string;
  establishedYear: string;
  social: {
    instagram?: string;
    telegram?: string;
    vk?: string;
    whatsapp?: string;
  };
  hero: {
    eyebrow: string;
    line1: string;
    line2: string;
    line3: string;
    lede: string;
  };
}
