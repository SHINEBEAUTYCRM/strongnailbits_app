import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  Package,
  Truck,
  CreditCard,
  Calendar,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors, fontSizes, borderRadius, spacing, shadows } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/lib/supabase/client';
import { useCartStore } from '@/stores/cart';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatPrice, formatDate } from '@/utils/format';
import type { Order, OrderItem } from '@/types/order';

const SHIPPING_LABELS: Record<string, string> = {
  np_warehouse: 'Нова Пошта — відділення',
  np_address: 'Нова Пошта — адресна',
  ukrposhta: 'Укрпошта',
  pickup: 'Самовивіз',
  np_intl: 'Нова Пошта International',
  ukrposhta_intl: 'Укрпошта International',
  nova_poshta: 'Нова Пошта',
  nova_poshta_courier: 'Нова Пошта — кур\'єр',
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Накладний платіж',
  liqpay: 'LiqPay',
  mono: 'Monobank',
  invoice: 'Рахунок',
  online: 'Онлайн оплата',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const addItem = useCartStore((s) => s.addItem);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
      setOrder(data as Order | null);
      setIsLoading(false);
    })();
  }, [id]);

  const copyTTN = async () => {
    if (!order?.ttn) return;
    await Clipboard.setStringAsync(order.ttn);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('ТТН скопійовано', 'success');
  };

  const handleRepeatOrder = () => {
    if (!order?.items?.length) return;
    Alert.alert(
      language === 'ru' ? 'Повторить заказ?' : 'Повторити замовлення?',
      language === 'ru'
        ? 'Товары будут добавлены в корзину'
        : 'Товари будуть додані до кошика',
      [
        { text: language === 'ru' ? 'Отмена' : 'Скасувати', style: 'cancel' },
        {
          text: language === 'ru' ? 'Добавить' : 'Додати',
          onPress: () => {
            for (const item of order.items) {
              addItem({
                product_id: item.product_id,
                name: item.name,
                slug: '',
                image: item.image ?? '',
                price: item.price,
                old_price: null,
                quantity: item.quantity,
                sku: item.sku,
                max_quantity: 999,
                weight: 0,
              });
            }
            showToast(
              language === 'ru' ? 'Товары добавлены в корзину' : 'Товари додано до кошика',
              'success',
            );
            router.push('/(tabs)/cart' as never);
          },
        },
      ],
    );
  };

  if (isLoading) return <Loading fullScreen />;

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {language === 'ru' ? 'Заказ не найден' : 'Замовлення не знайдено'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  const shippingLabel =
    SHIPPING_LABELS[order.shipping?.method] ?? order.shipping?.method ?? '—';
  const paymentLabel =
    PAYMENT_LABELS[order.payment_method] ?? order.payment_method ?? '—';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>#{order.order_number}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status & Date */}
        <View style={[styles.card, shadows.sm]}>
          <View style={styles.statusRow}>
            <StatusBadge status={order.status} />
            <View style={styles.dateRow}>
              <Calendar size={14} color={colors.darkTertiary} />
              <Text style={styles.dateText}>{formatDate(order.created_at)}</Text>
            </View>
          </View>
          {order.ttn && (
            <TouchableOpacity style={styles.ttnRow} onPress={copyTTN}>
              <Truck size={16} color={colors.coral} />
              <Text style={styles.ttnLabel}>ТТН:</Text>
              <Text style={styles.ttnValue}>{order.ttn}</Text>
              <Copy size={14} color={colors.coral} />
            </TouchableOpacity>
          )}
        </View>

        {/* Items */}
        <View style={[styles.card, shadows.sm]}>
          <View style={styles.cardHeader}>
            <Package size={18} color={colors.violet} />
            <Text style={styles.cardTitle}>
              {language === 'ru' ? 'Товары' : 'Товари'} ({order.items?.length ?? 0})
            </Text>
          </View>
          {(order.items ?? []).map((item: OrderItem, idx: number) => (
            <View
              key={item.product_id + idx}
              style={[
                styles.itemRow,
                idx < (order.items?.length ?? 0) - 1 && styles.itemBorder,
              ]}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                  <Package size={20} color={colors.darkTertiary} />
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.itemSku}>{item.sku}</Text>
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemQty}>{item.quantity} ×</Text>
                  <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                </View>
              </View>
              <Text style={styles.itemTotal}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery & Payment */}
        <View style={[styles.card, shadows.sm]}>
          <View style={styles.infoRow}>
            <Truck size={16} color={colors.darkTertiary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>
                {language === 'ru' ? 'Доставка' : 'Доставка'}
              </Text>
              <Text style={styles.infoValue}>{shippingLabel}</Text>
              {order.shipping?.city && (
                <Text style={styles.infoSub}>
                  {order.shipping.city}
                  {order.shipping.warehouse ? `, ${order.shipping.warehouse}` : ''}
                  {order.shipping.address ? `, ${order.shipping.address}` : ''}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <CreditCard size={16} color={colors.darkTertiary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>
                {language === 'ru' ? 'Оплата' : 'Оплата'}
              </Text>
              <Text style={styles.infoValue}>{paymentLabel}</Text>
            </View>
          </View>
        </View>

        {/* Totals */}
        <View style={[styles.card, shadows.sm]}>
          {order.subtotal > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {language === 'ru' ? 'Подытог' : 'Підсумок'}
              </Text>
              <Text style={styles.totalValue}>{formatPrice(order.subtotal)}</Text>
            </View>
          )}
          {order.shipping_cost > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {language === 'ru' ? 'Доставка' : 'Доставка'}
              </Text>
              <Text style={styles.totalValue}>{formatPrice(order.shipping_cost)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.totalRowFinal]}>
            <Text style={styles.totalFinalLabel}>
              {language === 'ru' ? 'Итого' : 'Разом'}
            </Text>
            <Text style={styles.totalFinalValue}>{formatPrice(order.total)}</Text>
          </View>
        </View>

        {order.notes ? (
          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.infoLabel}>
              {language === 'ru' ? 'Комментарий' : 'Коментар'}
            </Text>
            <Text style={styles.infoValue}>{order.notes}</Text>
          </View>
        ) : null}

        {/* Repeat Order */}
        <Button
          title={language === 'ru' ? 'Повторить заказ' : 'Повторити замовлення'}
          onPress={handleRepeatOrder}
          fullWidth
          variant="secondary"
          icon={<RefreshCw size={18} color={colors.dark} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pearl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: fontSizes.lg,
    fontFamily: 'JetBrainsMono-Bold',
    color: colors.dark,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
  },
  ttnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  ttnLabel: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
  },
  ttnValue: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontFamily: 'JetBrainsMono-Medium',
    color: colors.coral,
  },
  itemRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.pearl,
  },
  itemImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  itemSku: {
    fontSize: fontSizes.xs,
    fontFamily: 'JetBrainsMono-Regular',
    color: colors.darkTertiary,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  itemQty: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
  },
  itemPrice: {
    fontSize: fontSizes.xs,
    fontFamily: 'JetBrainsMono-Regular',
    color: colors.darkSecondary,
  },
  itemTotal: {
    fontSize: fontSizes.sm,
    fontFamily: 'JetBrainsMono-Medium',
    color: colors.dark,
    alignSelf: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
  },
  infoValue: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
    marginTop: 2,
  },
  infoSub: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
  },
  totalValue: {
    fontSize: fontSizes.sm,
    fontFamily: 'JetBrainsMono-Medium',
    color: colors.dark,
  },
  totalRowFinal: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalFinalLabel: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
  },
  totalFinalValue: {
    fontSize: fontSizes.md,
    fontFamily: 'JetBrainsMono-Bold',
    color: colors.dark,
  },
});
