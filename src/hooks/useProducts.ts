import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { ProductListItem, SortOption } from '@/types/product';

const PAGE_SIZE = 20;

/**
 * Stable sort: products without image and out-of-stock sink to bottom.
 * Priority: 0 = has image + in stock, 1 = has image + out of stock,
 *           2 = no image + in stock, 3 = no image + out of stock.
 */
export function sortByPriority(items: ProductListItem[]): ProductListItem[] {
  return [...items].sort((a, b) => {
    const pa = (a.main_image_url ? 0 : 2) + ((a.quantity ?? 0) > 0 ? 0 : 1);
    const pb = (b.main_image_url ? 0 : 2) + ((b.quantity ?? 0) > 0 ? 0 : 1);
    return pa - pb;
  });
}

const PRODUCT_SELECT =
  'id, slug, name_uk, name_ru, price, old_price, main_image_url, quantity, status, is_new, is_featured, brand_id, brands(name, slug)';

interface UseProductsOptions {
  categoryIds?: string[];
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: SortOption;
  enabled?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const {
    categoryIds,
    brandIds,
    minPrice,
    maxPrice,
    inStock,
    sort = 'popular',
    enabled = true,
  } = options;

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const fetchIdRef = useRef(0);

  const fetchProducts = useCallback(
    async (offset: number, append = false) => {
      if (!enabled) return;

      /* Track fetch identity to discard stale responses */
      const id = ++fetchIdRef.current;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        let query = supabase
          .from('products')
          .select(PRODUCT_SELECT, { count: 'exact' })
          .eq('status', 'active');

        if (categoryIds?.length) {
          query = query.in('category_id', categoryIds);
        }
        if (brandIds?.length) {
          query = query.in('brand_id', brandIds);
        }
        if (minPrice != null) {
          query = query.gte('price', minPrice);
        }
        if (maxPrice != null) {
          query = query.lte('price', maxPrice);
        }
        if (inStock) {
          query = query.gt('quantity', 0);
        }

        // Sort
        switch (sort) {
          case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'name_asc':
            query = query.order('name_uk', { ascending: true });
            break;
          default:
            query = query.order('quantity', { ascending: false });
        }

        query = query.range(offset, offset + PAGE_SIZE - 1);

        const { data, count, error } = await query;

        /* Discard if a newer fetch was started */
        if (id !== fetchIdRef.current) return;

        if (error) throw error;

        const raw = (data ?? []) as ProductListItem[];
        const items = sortByPriority(raw);
        setTotalCount(count ?? 0);
        setHasMore(raw.length === PAGE_SIZE);
        setInitialLoaded(true);

        if (append) {
          setProducts((prev) => [...prev, ...items]);
        } else {
          setProducts(items);
        }
      } catch (error) {
        if (id !== fetchIdRef.current) return;
        console.error('Failed to fetch products:', error);
      } finally {
        if (id === fetchIdRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [categoryIds, brandIds, minPrice, maxPrice, inStock, sort, enabled]
  );

  useEffect(() => {
    setInitialLoaded(false);
    setPage(0);
    fetchProducts(0);
  }, [fetchProducts]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage * PAGE_SIZE, true);
  }, [page, isLoadingMore, hasMore, fetchProducts]);

  const refresh = useCallback(() => {
    setPage(0);
    fetchProducts(0);
  }, [fetchProducts]);

  return {
    products,
    totalCount,
    isLoading: isLoading || (enabled && !initialLoaded),
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  };
}
