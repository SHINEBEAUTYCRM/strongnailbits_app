import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { useCartStore } from '@/stores/cart';

/**
 * Sets up Supabase Realtime subscriptions for:
 * - Cart sync (across devices)
 * - Order status updates
 */
export function useRealtimeSync() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Cart sync subscription
    const cartChannel = supabase
      .channel('cart-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'carts',
          filter: `profile_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && 'items' in payload.new) {
            const items = payload.new.items;
            if (Array.isArray(items)) {
              useCartStore.getState().setItems(items);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cartChannel);
    };
  }, [isAuthenticated, user?.id]);
}
