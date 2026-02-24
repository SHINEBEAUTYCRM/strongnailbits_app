import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSizes, borderRadius, spacing, shadows } from '@/theme';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, formatDate } from '@/utils/format';
import type { Document } from '@/types/profile';

const DOC_TYPE_MAP: Record<string, { label: string; variant: 'green' | 'red' | 'violet' }> = {
  sale: { label: 'Продаж', variant: 'green' },
  return: { label: 'Повернення', variant: 'red' },
  invoice: { label: 'Рахунок', variant: 'violet' },
};

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const docType = DOC_TYPE_MAP[document.doc_type] ?? { label: document.doc_type, variant: 'violet' as const };

  return (
    <View style={[styles.card, shadows.sm]}>
      <View style={styles.header}>
        <Badge text={docType.label} variant={docType.variant} />
        <Text style={styles.date}>{formatDate(document.doc_date)}</Text>
      </View>
      <Text style={styles.number}>{document.doc_number}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Сума</Text>
        <Text style={styles.total}>{formatPrice(document.total)}</Text>
      </View>
      {document.payment_status && (
        <View style={styles.row}>
          <Text style={styles.label}>Оплата</Text>
          <Text style={styles.value}>{document.payment_status}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
  },
  number: {
    fontSize: fontSizes.md,
    fontFamily: 'JetBrainsMono-Medium',
    color: colors.dark,
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
  total: {
    fontSize: fontSizes.sm,
    fontFamily: 'JetBrainsMono-Bold',
    color: colors.dark,
  },
  value: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
});
