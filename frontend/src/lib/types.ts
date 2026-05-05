// Types mirroring the Django API responses

export interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'manager' | 'worker' | 'customer';
  shop: number | null;
  shop_name?: string;
  shop_slug?: string;
}

export interface Category {
  id: number;
  shop: number;
  name: string;
  slug: string;
  description: string;
  photo: string | null;
  is_active: boolean;
  sort_order: number;
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
  name: string;
  slug: string;
  category: number;
  category_name: string;
  description?: string;
  photo: string | null;
  base_price: string;
  stock: number;
  low_stock_threshold?: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  is_active: boolean;
  is_featured: boolean;
  available_for_custom: boolean;
  sizes?: FlowerSize[];
  discount_tiers?: DiscountTier[];
}

export interface Promotion {
  id: number;
  shop: number;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  banner_image: string | null;
  badge_text: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  promo_code: string;
  scope: string;
  starts_at: string;
  ends_at: string;
  is_running: boolean;
  is_featured: boolean;
}

export interface CartItem {
  id: number;
  flower: number;
  flower_name: string;
  flower_photo: string | null;
  size: number | null;
  size_label: string | null;
  quantity: number;
  stems: number;
  custom_bouquet_id: string | null;
  is_custom: boolean;
  line_total: string;
  created_at: string;
}

export interface Cart {
  id: number;
  shop: number;
  shop_slug: string;
  shop_name: string;
  items: CartItem[];
  total: string;
  item_count: number;
}

export interface OrderItem {
  id: number;
  flower: number | null;
  flower_name: string;
  size: number | null;
  size_label: string;
  custom_bouquet_id: string | null;
  stems: number;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface Order {
  id: number;
  number: string;
  shop: number;
  shop_name: string;
  shop_slug: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_method: 'delivery' | 'pickup';
  delivery_address: string;
  delivery_date: string | null;
  delivery_time: string;
  delivery_cost: string;
  note: string;
  subtotal: string;
  discount_amount: string;
  total: string;
  promotion: number | null;
  promo_code_used: string;
  status: string;
  payment_status: string | null;
  created_at: string;
  paid_at: string | null;
  items: OrderItem[];
}

export interface DashboardOverview {
  shop: { name: string; slug: string };
  revenue: { today: string; this_month: string; last_30_days: string };
  orders: { today: number; pending_payment: number; processing: number; total_paid: number };
  inventory: { low_stock_flowers: number; out_of_stock_flowers: number; total_flowers: number };
  customers: { total: number };
  recent_orders: Order[];
}
