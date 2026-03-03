import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getSearchVariants } from '@/utils/search-helpers';
import { sortByPriority } from '@/hooks/useProducts';
import type { ProductListItem, Brand } from '@/types/product';

const DEBOUNCE_MS = 300;

export function useSearch() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!query.trim()) {
      setProducts([]);
      setBrands([]);
      setHasSearched(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      performSearch(query.trim());
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const performSearch = useCallback(async (searchText: string) => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const variants = getSearchVariants(searchText);
      const orConditions = variants
        .flatMap((v) => [
          `name_uk.ilike.%${v}%`,
          `name_ru.ilike.%${v}%`,
          `sku.ilike.%${v}%`,
        ])
        .join(',');

      const [productsRes, brandsRes] = await Promise.all([
        supabase
          .from('products')
          .select(
            'id, slug, name_uk, name_ru, price, old_price, main_image_url, quantity, status, is_new, is_featured, brand_id, brands(name, slug)'
          )
          .eq('status', 'active')
          .or(orConditions)
          .order('quantity', { ascending: false })
          .limit(40),
        supabase
          .from('brands')
          .select('id, name, slug, logo_url')
          .or(
            variants.map((v) => `name.ilike.%${v}%`).join(',')
          )
          .limit(10),
      ]);

      setProducts(sortByPriority((productsRes.data ?? []) as ProductListItem[]));
      setBrands((brandsRes.data ?? []) as Brand[]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    query,
    setQuery,
    products,
    brands,
    isLoading,
    hasSearched,
  };
}
