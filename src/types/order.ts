export interface Order {
  id: string;
  order_number: string;
  profile_id: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  shipping_cost: number;
  items: OrderItem[];
  contact: OrderContact;
  shipping: OrderShipping;
  payment_method: string;
  notes: string | null;
  ttn: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  product_id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderContact {
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface OrderShipping {
  method: ShippingMethod;
  city?: string;
  warehouse?: string;
  address?: string;
  country?: string;
}

export type ShippingMethod =
  | 'nova_poshta'
  | 'nova_poshta_courier'
  | 'ukrposhta'
  | 'pickup'
  | 'international';

export type PaymentMethod = 'cod' | 'invoice' | 'online';

export const ORDER_STATUS_MAP: Record<
  OrderStatus,
  { label_uk: string; label_ru: string; color: string }
> = {
  new: { label_uk: 'Новий', label_ru: 'Новый', color: '#8B5CF6' },
  processing: { label_uk: 'В обробці', label_ru: 'В обработке', color: '#C27400' },
  shipped: { label_uk: 'Відправлено', label_ru: 'Отправлено', color: '#3B82F6' },
  delivered: { label_uk: 'Доставлено', label_ru: 'Доставлено', color: '#008040' },
  cancelled: { label_uk: 'Скасовано', label_ru: 'Отменён', color: '#E0352B' },
};
