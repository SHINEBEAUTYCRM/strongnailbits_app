import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppConfig } from '@/hooks/useAppConfig';
import type { PaymentMethod } from '@/types/order';

interface PaymentFormProps {
  method: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

const PAYMENT_ICONS: Record<string, string> = {
  cod: '💵',
  invoice: '🏦',
  online: '💳',
};

export function PaymentForm({ method, onChange }: PaymentFormProps) {
  const { language } = useLanguage();
  const { paymentMethods } = useAppConfig();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {language === 'ru' ? 'Способ оплаты' : 'Спосіб оплати'}
      </Text>
      {paymentMethods.map((pm) => (
        <TouchableOpacity
          key={pm.id}
          style={[styles.option, method === pm.id && styles.optionActive]}
          onPress={() => onChange(pm.id as PaymentMethod)}
        >
          <Text style={styles.icon}>{PAYMENT_ICONS[pm.id] ?? '💳'}</Text>
          <Text style={[styles.label, method === pm.id && styles.labelActive]}>
            {language === 'ru' ? (pm.name_ru ?? pm.name_uk) : pm.name_uk}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    fontSize: fontSizes.lg,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optionActive: {
    borderColor: colors.coral,
    backgroundColor: '#FFF5F5',
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  labelActive: {
    color: colors.coral,
  },
});
