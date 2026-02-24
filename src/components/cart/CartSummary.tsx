import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useCartStore } from '@/stores/cart';
import { formatPrice, formatWeight, getProductWord } from '@/utils/format';

export function CartSummary() {
  const { language } = useLanguage();
  const { freeShippingThreshold } = useAppConfig();
  const total = useCartStore((s) => s.getTotal());
  const count = useCartStore((s) => s.getCount());
  const weight = useCartStore((s) => s.getWeight());
  const remaining = freeShippingThreshold - total;
  const progress = Math.min(total / freeShippingThreshold, 1);

  return (
    <View style={styles.container}>
      {/* Free shipping progress */}
      {remaining > 0 && (
        <View style={styles.shippingBar}>
          <Text style={styles.shippingText}>
            {language === 'ru'
              ? `До бесплатной доставки: ${formatPrice(remaining)}`
              : `До безкоштовної доставки: ${formatPrice(remaining)}`}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      )}
      {remaining <= 0 && (
        <Text style={styles.freeShipping}>
          {language === 'ru' ? '✅ Бесплатная доставка!' : '✅ Безкоштовна доставка!'}
        </Text>
      )}

      {/* Summary */}
      <View style={styles.row}>
        <Text style={styles.label}>
          {language === 'ru' ? 'Количество товаров' : 'Кількість товарів'}
        </Text>
        <Text style={styles.value}>
          {count} {getProductWord(count, language)}
        </Text>
      </View>
      {weight > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>
            {language === 'ru' ? 'Общий вес' : 'Загальна вага'}
          </Text>
          <Text style={styles.value}>{formatWeight(weight)}</Text>
        </View>
      )}
      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.totalLabel}>
          {language === 'ru' ? 'Сумма' : 'Сума'}
        </Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  shippingBar: {
    gap: spacing.sm,
  },
  shippingText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.coral,
    borderRadius: 2,
  },
  freeShipping: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.green,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderTopColor: colors.borderLight,
  },
  totalLabel: {
    fontSize: fontSizes.lg,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
  },
  totalValue: {
    fontSize: fontSizes.xl,
    fontFamily: 'JetBrainsMono-Bold',
    color: colors.coral,
  },
});
