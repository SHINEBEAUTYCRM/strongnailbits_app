import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useCartStore } from '@/stores/cart';
import { formatPrice, formatWeight, getProductWord } from '@/utils/format';

export function OrderSummary() {
  const { language } = useLanguage();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.getTotal());
  const count = useCartStore((s) => s.getCount());
  const weight = useCartStore((s) => s.getWeight());
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.title}>
          {language === 'ru' ? 'Итог заказа' : 'Підсумок замовлення'}
        </Text>
        {expanded ? (
          <ChevronUp size={20} color={colors.dark} />
        ) : (
          <ChevronDown size={20} color={colors.dark} />
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.items}>
          {items.map((item) => (
            <View key={item.product_id} style={styles.item}>
              <Image
                source={{ uri: item.image || undefined }}
                style={styles.itemImage}
                contentFit="cover"
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemQty}>
                  {item.quantity} x {formatPrice(item.price)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.summary}>
        <View style={styles.row}>
          <Text style={styles.label}>
            {count} {getProductWord(count, language)}
          </Text>
          <Text style={styles.value}>{formatPrice(total)}</Text>
        </View>
        {weight > 0 && (
          <View style={styles.row}>
            <Text style={styles.label}>
              {language === 'ru' ? 'Вес' : 'Вага'}
            </Text>
            <Text style={styles.value}>{formatWeight(weight)}</Text>
          </View>
        )}
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>
            {language === 'ru' ? 'Всего' : 'Всього'}
          </Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.lg,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
  },
  items: {
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.sand,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  itemQty: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
  },
  itemTotal: {
    fontSize: fontSizes.sm,
    fontFamily: 'JetBrainsMono-Medium',
    color: colors.dark,
  },
  summary: {
    gap: spacing.sm,
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
  totalRow: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: fontSizes.lg,
    fontFamily: 'Inter-Bold',
    color: colors.dark,
  },
  totalValue: {
    fontSize: fontSizes.xl,
    fontFamily: 'JetBrainsMono-Bold',
    color: colors.coral,
  },
});
