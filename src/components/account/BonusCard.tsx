import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSizes, spacing } from '@/theme';
import { formatDate } from '@/utils/format';
import type { Bonus } from '@/types/profile';

interface BonusCardProps {
  bonus: Bonus;
}

export function BonusCard({ bonus }: BonusCardProps) {
  const isPositive = bonus.type === 'accrual';

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.reason}>{bonus.reason ?? (isPositive ? 'Нарахування' : 'Списання')}</Text>
        <Text style={styles.date}>{formatDate(bonus.created_at)}</Text>
      </View>
      <Text style={[styles.amount, isPositive ? styles.positive : styles.negative]}>
        {isPositive ? '+' : '-'}{bonus.amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  reason: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  date: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
  },
  amount: {
    fontSize: fontSizes.lg,
    fontFamily: 'JetBrainsMono-Bold',
  },
  positive: {
    color: colors.green,
  },
  negative: {
    color: colors.red,
  },
});
