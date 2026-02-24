import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppConfig } from '@/hooks/useAppConfig';
import { Input } from '@/components/ui/Input';
import type { ShippingMethod } from '@/types/order';

interface ShippingData {
  method: ShippingMethod;
  city: string;
  warehouse: string;
  address: string;
  country: string;
}

interface ShippingFormProps {
  data: ShippingData;
  onChange: (data: ShippingData) => void;
}

export function ShippingForm({ data, onChange }: ShippingFormProps) {
  const { language } = useLanguage();
  const { shippingMethods } = useAppConfig();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {language === 'ru' ? 'Способ доставки' : 'Спосіб доставки'}
      </Text>

      {/* Methods */}
      {shippingMethods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.methodCard,
            data.method === method.id && styles.methodCardActive,
          ]}
          onPress={() => onChange({ ...data, method: method.id as ShippingMethod })}
        >
          <Text style={styles.methodIcon}>{method.icon}</Text>
          <Text style={[
            styles.methodName,
            data.method === method.id && styles.methodNameActive,
          ]}>
            {language === 'ru' ? (method.name_ru ?? method.name_uk) : method.name_uk}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Conditional fields */}
      {(data.method === 'nova_poshta' || data.method === 'nova_poshta_courier') && (
        <>
          <Input
            label={language === 'ru' ? 'Город' : 'Місто'}
            value={data.city}
            onChangeText={(city) => onChange({ ...data, city })}
          />
          {data.method === 'nova_poshta' && (
            <Input
              label={language === 'ru' ? 'Отделение' : 'Відділення'}
              value={data.warehouse}
              onChangeText={(warehouse) => onChange({ ...data, warehouse })}
            />
          )}
          {data.method === 'nova_poshta_courier' && (
            <Input
              label={language === 'ru' ? 'Адрес' : 'Адреса'}
              value={data.address}
              onChangeText={(address) => onChange({ ...data, address })}
            />
          )}
        </>
      )}
      {data.method === 'ukrposhta' && (
        <Input
          label={language === 'ru' ? 'Адрес' : 'Адреса'}
          value={data.address}
          onChangeText={(address) => onChange({ ...data, address })}
        />
      )}
      {data.method === 'international' && (
        <>
          <Input
            label={language === 'ru' ? 'Страна' : 'Країна'}
            value={data.country}
            onChangeText={(country) => onChange({ ...data, country })}
          />
          <Input
            label={language === 'ru' ? 'Адрес' : 'Адреса'}
            value={data.address}
            onChangeText={(address) => onChange({ ...data, address })}
          />
        </>
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
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  methodCardActive: {
    borderColor: colors.coral,
    backgroundColor: '#FFF5F5',
  },
  methodIcon: {
    fontSize: 20,
  },
  methodName: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  methodNameActive: {
    color: colors.coral,
  },
});
