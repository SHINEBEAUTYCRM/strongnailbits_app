import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useCartStore } from '@/stores/cart';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CartItem } from '@/types/cart';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

async function saveCartToSupabase(userId: string, items: CartItem[]) {
  try {
    const cartItems = items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    await supabase.from('carts').upsert(
      {
        profile_id: userId,
        items: cartItems,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id' }
    );
  } catch (err) {
    console.error('[CartSync] Save error:', err);
  }
}

async function loadCartFromSupabase(userId: string): Promise<CartItem[] | null> {
  try {
    const { data: cart } = await supabase
      .from('carts')
      .select('items')
      .eq('profile_id', userId)
      .maybeSingle();

    if (!cart?.items || !Array.isArray(cart.items) || cart.items.length === 0) {
      return null;
    }

    const productIds = cart.items.map((i: any) => i.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('id, slug, name_uk, price, old_price, main_image_url, quantity, weight, sku')
      .in('id', productIds)
      .eq('status', 'active');

    if (!products || products.length === 0) return null;

    const productMap = new Map(products.map(p => [p.id, p]));

    return cart.items
      .map((item: any) => {
        const p = productMap.get(item.product_id);
        if (!p) return null;
        return {
          product_id: p.id,
          name: p.name_uk,
          slug: p.slug,
          image: p.main_image_url || '',
          price: p.price,
          old_price: p.old_price,
          quantity: Math.min(item.quantity, p.quantity),
          sku: p.sku || '',
          max_quantity: p.quantity,
          weight: p.weight || 0,
        } as CartItem;
      })
      .filter((item): item is CartItem => item !== null);
  } catch (err) {
    console.error('[CartSync] Load error:', err);
    return null;
  }
}

export function useCartSync() {
  const { user } = useAuth();
  const items = useCartStore((s) => s.items);
  const loaded = useRef(false);
  const skipNextSave = useRef(false);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      loaded.current = false;
      return;
    }

    async function load() {
      const localItems = useCartStore.getState().items;
      const remoteItems = await loadCartFromSupabase(userId!);

      if (remoteItems && remoteItems.length > 0 && localItems.length === 0) {
        skipNextSave.current = true;
        useCartStore.setState({ items: remoteItems });
      } else if (remoteItems && remoteItems.length > 0 && localItems.length > 0) {
        const merged = [...localItems];
        for (const remote of remoteItems) {
          if (!merged.find(l => l.product_id === remote.product_id)) {
            merged.push(remote);
          }
        }
        skipNextSave.current = true;
        useCartStore.setState({ items: merged });
        saveCartToSupabase(userId!, merged);
      } else if (localItems.length > 0) {
        saveCartToSupabase(userId!, localItems);
      }
      loaded.current = true;
    }
    load();
  }, [userId]);

  useEffect(() => {
    if (!loaded.current || !userId) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveCartToSupabase(userId, items);
    }, 1500);

    return () => {
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [items, userId]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' && userId && loaded.current) {
        const currentItems = useCartStore.getState().items;
        if (currentItems.length > 0) {
          saveCartToSupabase(userId, currentItems);
        }
      }
    });
    return () => sub.remove();
  }, [userId]);
}
