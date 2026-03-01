import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Copy, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors, fontSizes, borderRadius, spacing, shadows } from '@/theme';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { formatPrice, formatDate } from '@/utils/format';
import type { Order } from '@/types/order';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const copyTTN = async () => {
    if (!order.ttn) return;
    await Clipboard.setStringAsync(order.ttn);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('ТТН скопійовано', 'success');
  };

  return (
    <TouchableOpacity
      style={[styles.card, shadows.sm]}
      activeOpacity={0.7}
      onPress={() => router.push(`/(tabs)/account/order/${order.id}` as never)}
    >
      <View style={styles.header}>
        <Text style={styles.orderNumber}>#{order.order_number}</Text>
        <View style={styles.headerRight}>
          <StatusBadge status={order.status} />
          <ChevronRight size={18} color={colors.darkTertiary} />
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>Дата</Text>
          <Text style={styles.value}>{formatDate(order.created_at)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Сума</Text>
          <Text style={styles.valuePrice}>{formatPrice(order.total)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Товарів</Text>
          <Text style={styles.value}>{order.items?.length ?? 0}</Text>
        </View>
      </View>

      {order.ttn && (
        <TouchableOpacity style={styles.ttnRow} onPress={copyTTN}>
          <Text style={styles.ttnLabel}>ТТН:</Text>
          <Text style={styles.ttnValue}>{order.ttn}</Text>
          <Copy size={14} color={colors.coral} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  orderNumber: {
    fontSize: fontSizes.lg,
    fontFamily: 'JetBrainsMono-Bold',
    color: colors.dark,
  },
  details: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
  },
  value: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  valuePrice: {
    fontSize: fontSizes.sm,
    fontFamily: 'JetBrainsMono-Medium',
    color: colors.dark,
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
});
