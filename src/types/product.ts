export interface Product {
  id: string;
  slug: string;
  name_uk: string;
  name_ru: string | null;
  sku: string | null;
  description_uk: string | null;
  description_ru: string | null;
  price: number;
  old_price: number | null;
  wholesale_price: number | null;
  quantity: number;
  status: 'active' | 'inactive' | 'hidden';
  images: string[] | null;
  main_image_url: string | null;
  weight: number | null;
  properties: Record<string, string> | null;
  is_new: boolean;
  is_featured: boolean;
  category_id: string | null;
  brand_id: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  categories?: Category | null;
  brands?: Brand | null;
}

export interface ProductListItem {
  id: string;
  slug: string;
  name_uk: string;
  name_ru: string | null;
  price: number;
  old_price: number | null;
  main_image_url: string | null;
  quantity: number;
  status: string;
  is_new: boolean;
  is_featured: boolean;
  brand_id: string | null;
  brands?: { name: string; slug: string } | null;
}

export interface Category {
  id: string;
  cs_cart_id: number | null;
  parent_cs_cart_id: number | null;
  slug: string;
  name_uk: string;
  name_ru: string | null;
  image_url: string | null;
  product_count: number;
  position: number;
  status: string;
  children?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export interface CatalogFilters {
  minPrice?: number;
  maxPrice?: number;
  brandIds: string[];
  inStock: boolean;
}

export type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'newest' | 'name_asc';

export const SORT_OPTIONS: { value: SortOption; label_uk: string; label_ru: string }[] = [
  { value: 'popular', label_uk: 'Популярні', label_ru: 'Популярные' },
  { value: 'price_asc', label_uk: 'Від дешевих', label_ru: 'От дешёвых' },
  { value: 'price_desc', label_uk: 'Від дорогих', label_ru: 'От дорогих' },
  { value: 'newest', label_uk: 'Новинки', label_ru: 'Новинки' },
  { value: 'name_asc', label_uk: 'За назвою А-Я', label_ru: 'По названию А-Я' },
];
