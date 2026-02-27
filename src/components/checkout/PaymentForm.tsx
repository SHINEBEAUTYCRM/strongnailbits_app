import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { Input } from '@/components/ui/Input';

const PAYMENT_METHODS = [
  {
    id: 'cod',
    label_uk: 'Оплата при отриманні (накладений платіж)',
    label_ru: 'Оплата при получении (наложенный платёж)',
    icon: '💵',
    domestic: true,
  },
  {
    id: 'liqpay',
    label_uk: 'Оплата онлайн (LiqPay)',
    label_ru: 'Оплата онлайн (LiqPay)',
    icon: '💳',
    soon: true,
  },
  {
    id: 'mono',
    label_uk: 'Оплата онлайн (Mono)',
    label_ru: 'Оплата онлайн (Mono)',
    icon: '💳',
    soon: true,
  },
  {
    id: 'invoice',
    label_uk: 'Безготівковий розрахунок (для юр. осіб)',
    label_ru: 'Безналичный расчёт (для юр. лиц)',
    icon: '🏦',
  },
];

interface PaymentFormProps {
  method: string;
  onChange: (method: string) => void;
  isInternational: boolean;
  companyName: string;
  edrpou: string;
  onCompanyChange: (data: { companyName: string; edrpou: string }) => void;
}

export function PaymentForm({
  method,
  onChange,
  isInternational,
  companyName,
  edrpou,
  onCompanyChange,
}: PaymentFormProps) {
  const { language } = useLanguage();

  const availableMethods = PAYMENT_METHODS.filter(
    (pm) => !(isInternational && pm.domestic)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {language === 'ru' ? 'Способ оплаты' : 'Спосіб оплати'}
      </Text>

      {availableMethods.map((pm) => {
        const isActive = method === pm.id;
        const isDisabled = !!pm.soon;

        return (
          <TouchableOpacity
            key={pm.id}
            style={[
              styles.option,
              isActive && styles.optionActive,
              isDisabled && styles.optionDisabled,
            ]}
            onPress={() => !isDisabled && onChange(pm.id)}
            activeOpacity={isDisabled ? 1 : 0.7}
          >
            <Text style={styles.icon}>{pm.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive, isDisabled && styles.labelDisabled]}>
              {language === 'ru' ? pm.label_ru : pm.label_uk}
            </Text>
            {pm.soon && (
              <View style={styles.soonBadge}>
                <Text style={styles.soonText}>
                  {language === 'ru' ? 'Скоро' : 'Скоро'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Поля для юр. осіб */}
      {method === 'invoice' && (
        <View style={styles.invoiceFields}>
          <Text style={styles.invoiceTitle}>
            {language === 'ru' ? 'Реквизиты компании' : 'Реквізити компанії'}
          </Text>
          <Input
            label={language === 'ru' ? 'Название компании' : 'Назва компанії'}
            value={companyName}
            onChangeText={(val) => onCompanyChange({ companyName: val, edrpou })}
          />
          <Input
            label={language === 'ru' ? 'ЕДРПОУ' : 'ЄДРПОУ'}
            value={edrpou}
            onChangeText={(val) => onCompanyChange({ companyName, edrpou: val })}
            keyboardType="numeric"
            maxLength={8}
          />
        </View>
      )}
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
  optionDisabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    flex: 1,
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  labelActive: {
    color: colors.coral,
  },
  labelDisabled: {
    color: colors.darkTertiary,
  },
  soonBadge: {
    backgroundColor: colors.amber,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  soonText: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  invoiceFields: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.sand,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  invoiceTitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
  },
});
