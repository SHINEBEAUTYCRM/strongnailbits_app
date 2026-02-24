import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from '@/components/ui/Input';
import { colors, fontSizes, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';

interface ContactData {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ContactFormProps {
  data: ContactData;
  onChange: (data: ContactData) => void;
  errors?: Partial<Record<keyof ContactData, string>>;
}

export function ContactForm({ data, onChange, errors }: ContactFormProps) {
  const { language } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {language === 'ru' ? 'Контактная информация' : 'Контактна інформація'}
      </Text>
      <Input
        label={language === 'ru' ? 'Телефон *' : 'Телефон *'}
        value={data.phone}
        onChangeText={(phone) => onChange({ ...data, phone })}
        keyboardType="phone-pad"
        placeholder="+380 XX XXX XX XX"
        error={errors?.phone}
      />
      <Input
        label={language === 'ru' ? 'Имя *' : "Ім'я *"}
        value={data.firstName}
        onChangeText={(firstName) => onChange({ ...data, firstName })}
        error={errors?.firstName}
      />
      <Input
        label={language === 'ru' ? 'Фамилия *' : 'Прізвище *'}
        value={data.lastName}
        onChangeText={(lastName) => onChange({ ...data, lastName })}
        error={errors?.lastName}
      />
      <Input
        label="Email"
        value={data.email}
        onChangeText={(email) => onChange({ ...data, email })}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors?.email}
      />
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
});
