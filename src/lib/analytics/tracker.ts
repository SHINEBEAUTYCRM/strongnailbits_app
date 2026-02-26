import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase/client';

type EventName =
  | 'page_view'
  | 'view_item'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'search'
  | 'view_item_list';

interface EventData {
  [key: string]: unknown;
}

const APP_VERSION = process.env.EXPO_PUBLIC_APP_VERSION ?? '1.0.0';

export async function trackEvent(
  event: EventName,
  data?: EventData
): Promise<void> {
  try {
    await supabase.from('site_events').insert({
      event_type: event,
      page_path: data?.page_path as string ?? null,
      product_id: data?.product_id as string ?? null,
      product_name: data?.product_name as string ?? null,
      search_query: data?.search_query as string ?? null,
      order_id: data?.order_id as string ?? null,
      revenue: data?.revenue as number ?? null,
      device_type: 'mobile',
      metadata: {
        ...data,
        platform: Platform.OS,
        app_version: APP_VERSION,
      },
    });
  } catch (error) {
    // Silently fail — analytics should not break UX
    console.warn('Analytics tracking failed:', error);
  }
}

export function trackPageView(pagePath: string, pageTitle?: string): void {
  trackEvent('page_view', { page_path: pagePath, page_title: pageTitle });
}

export function trackViewItem(productId: string, productName: string): void {
  trackEvent('view_item', { product_id: productId, product_name: productName });
}

export function trackAddToCart(
  productId: string,
  productName: string,
  revenue: number
): void {
  trackEvent('add_to_cart', {
    product_id: productId,
    product_name: productName,
    revenue,
  });
}

export function trackRemoveFromCart(productId: string): void {
  trackEvent('remove_from_cart', { product_id: productId });
}

export function trackBeginCheckout(revenue: number): void {
  trackEvent('begin_checkout', { revenue });
}

export function trackPurchase(orderId: string, revenue: number): void {
  trackEvent('purchase', { order_id: orderId, revenue });
}

export function trackSearch(searchQuery: string): void {
  trackEvent('search', { search_query: searchQuery });
}
