export interface CartItem {
  product_id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  old_price: number | null;
  quantity: number;
  sku: string;
  max_quantity: number;
  weight: number;
}
