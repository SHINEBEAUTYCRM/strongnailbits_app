export interface Profile {
  id: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company: string | null;
  is_b2b: boolean;
  loyalty_points: number;
  loyalty_tier: LoyaltyTier;
  balance: number;
  credit_limit: number;
  discount_percent: number;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Bonus {
  id: string;
  profile_id: string;
  amount: number;
  type: 'accrual' | 'deduction';
  reason: string | null;
  order_id: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  profile_id: string;
  doc_type: 'sale' | 'return' | 'invoice';
  doc_number: string;
  doc_date: string;
  total: number;
  payment_status: string;
  ttn: string | null;
  created_at: string;
}

export interface NotificationFeedItem {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  body: string;
  image_url: string | null;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
