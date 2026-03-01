import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useWishlistStore, WishlistItem } from '@/stores/wishlist';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

async function saveWishlistToSupabase(userId: string, items: WishlistItem[]) {
  try {
    // Sync: delete all user's items and insert current ones
    await supabase.from('wishlist_items').delete().eq('profile_id', userId);

    if (items.length > 0) {
      const rows = items.map((item) => ({
        profile_id: userId,
        product_id: item.product_id,
      }));
      await supabase.from('wishlist_items').insert(rows);
    }
  } catch (err) {
    console.error('[WishlistSync] Save error:', err);
  }
}

async function loadWishlistFromSupabase(userId: string): Promise<WishlistItem[] | null> {
  try {
    const { data: wishlistRows } = await supabase
      .from('wishlist_items')
      .select('product_id')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });

    if (!wishlistRows || wishlistRows.length === 0) return null;

    const productIds = wishlistRows.map((r) => r.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('id, slug, name_uk, price, old_price, main_image_url')
      .in('id', productIds)
      .eq('status', 'active');

    if (!products || products.length === 0) return null;

    const productMap = new Map(products.map((p) => [p.id, p]));

    return wishlistRows
      .map((row) => {
        const p = productMap.get(row.product_id);
        if (!p) return null;
        return {
          product_id: p.id,
          name: p.name_uk,
          slug: p.slug,
          image: p.main_image_url || '',
          price: p.price,
          old_price: p.old_price,
          added_at: new Date().toISOString(),
        } as WishlistItem;
      })
      .filter((item): item is WishlistItem => item !== null);
  } catch (err) {
    console.error('[WishlistSync] Load error:', err);
    return null;
  }
}

export function useWishlistSync() {
  const { user } = useAuth();
  const items = useWishlistStore((s) => s.items);
  const loaded = useRef(false);
  const skipNextSave = useRef(false);
  const userId = user?.id;

  // Load on login
  useEffect(() => {
    if (!userId) {
      loaded.current = false;
      return;
    }

    async function load() {
      const localItems = useWishlistStore.getState().items;
      const remoteItems = await loadWishlistFromSupabase(userId!);

      if (remoteItems && remoteItems.length > 0 && localItems.length === 0) {
        skipNextSave.current = true;
        useWishlistStore.setState({ items: remoteItems });
      } else if (remoteItems && remoteItems.length > 0 && localItems.length > 0) {
        // Merge: keep local + add remote that don't exist locally
        const merged = [...localItems];
        for (const remote of remoteItems) {
          if (!merged.find((l) => l.product_id === remote.product_id)) {
            merged.push(remote);
          }
        }
        skipNextSave.current = true;
        useWishlistStore.setState({ items: merged });
        saveWishlistToSupabase(userId!, merged);
      } else if (localItems.length > 0) {
        saveWishlistToSupabase(userId!, localItems);
      }
      loaded.current = true;
    }
    load();
  }, [userId]);

  // Save on change (debounced)
  useEffect(() => {
    if (!loaded.current || !userId) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveWishlistToSupabase(userId, items);
    }, 1500);

    return () => {
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [items, userId]);

  // Save when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' && userId && loaded.current) {
        const currentItems = useWishlistStore.getState().items;
        if (currentItems.length > 0) {
          saveWishlistToSupabase(userId, currentItems);
        }
      }
    });
    return () => sub.remove();
  }, [userId]);
}
