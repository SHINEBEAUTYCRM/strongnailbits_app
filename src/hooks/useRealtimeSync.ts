import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { useCartStore } from '@/stores/cart';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/hooks/useLanguage';

const ORDER_STATUS_LABELS: Record<string, { uk: string; ru: string }> = {
  processing: { uk: 'В обробці', ru: 'В обработке' },
  shipped: { uk: 'Відправлено', ru: 'Отправлено' },
  delivered: { uk: 'Доставлено', ru: 'Доставлено' },
  cancelled: { uk: 'Скасовано', ru: 'Отменён' },
};

/**
 * Sets up Supabase Realtime subscriptions for:
 * - Cart sync (across devices)
 * - Order status updates
 */
export function useRealtimeSync() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { language } = useLanguage();

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

    // Order status subscription
    const ordersChannel = supabase
      .channel('my-orders-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `profile_id=eq.${user.id}`,
        },
        (payload) => {
          const oldStatus = (payload.old as Record<string, unknown>)?.status;
          const newStatus = (payload.new as Record<string, unknown>)?.status;
          const orderNumber = (payload.new as Record<string, unknown>)?.order_number;

          if (newStatus && newStatus !== oldStatus && orderNumber) {
            const label = ORDER_STATUS_LABELS[newStatus as string];
            if (label) {
              const statusText = language === 'ru' ? label.ru : label.uk;
              showToast(`#${orderNumber}: ${statusText}`, 'info');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cartChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [isAuthenticated, user?.id, language]);
}
