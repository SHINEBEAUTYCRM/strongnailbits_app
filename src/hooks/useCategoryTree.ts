import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CacheManager, CACHE_TTL } from '@/lib/cache/manager';
import type { Category } from '@/types/product';

export function useCategoryTree() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tree, setTree] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const cached = await CacheManager.get<Category[]>('categories');
    if (cached) {
      setCategories(cached);
      setTree(buildTree(cached));
      setIsLoading(false);
      fetchCategories();
      return;
    }
    await fetchCategories();
  }

  async function fetchCategories() {
    try {
      const { data } = await supabase
        .from('categories')
        .select(
          'id, cs_cart_id, parent_cs_cart_id, slug, name_uk, name_ru, image_url, product_count, position, status'
        )
        .eq('status', 'active')
        .order('position');

      if (data) {
        const cats = data as Category[];
        setCategories(cats);
        setTree(buildTree(cats));
        await CacheManager.set('categories', cats, CACHE_TTL.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return { categories, tree, isLoading, refresh: fetchCategories };
}

function buildTree(categories: Category[]): Category[] {
  const map = new Map<number, Category>();
  const roots: Category[] = [];

  categories.forEach((cat) => {
    if (cat.cs_cart_id != null) {
      map.set(cat.cs_cart_id, { ...cat, children: [] });
    }
  });

  categories.forEach((cat) => {
    const node = cat.cs_cart_id != null ? map.get(cat.cs_cart_id)! : { ...cat, children: [] };
    if (cat.parent_cs_cart_id == null) {
      roots.push(node);
    } else {
      const parent = map.get(cat.parent_cs_cart_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  });

  return roots;
}

export function getDescendantIds(
  categories: Category[],
  parentSlug: string
): string[] {
  const ids: string[] = [];

  function findAndCollect(cats: Category[], found: boolean): void {
    for (const cat of cats) {
      if (found || cat.slug === parentSlug) {
        ids.push(cat.id);
        if (cat.children) {
          findAndCollect(cat.children, true);
        }
        if (cat.slug === parentSlug && cat.children) {
          findAndCollect(cat.children, true);
        }
      } else if (cat.children) {
        findAndCollect(cat.children, false);
      }
    }
  }

  findAndCollect(categories, false);
  return ids;
}
