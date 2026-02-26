import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/hooks/useLanguage';
import { spacing } from '@/theme';

interface RegisterData {
  firstName: string;
  lastName: string;
  company: string;
  password: string;
}

interface RegisterFormProps {
  data: RegisterData;
  onChange: (data: RegisterData) => void;
  errors?: Partial<Record<keyof RegisterData, string>>;
}

export function RegisterForm({ data, onChange, errors }: RegisterFormProps) {
  const { language } = useLanguage();

  return (
    <View style={styles.container}>
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
        label={language === 'ru' ? 'Компания' : 'Компанія'}
        value={data.company}
        onChangeText={(company) => onChange({ ...data, company })}
      />
      <Input
        label={language === 'ru' ? 'Пароль *' : 'Пароль *'}
        value={data.password}
        onChangeText={(password) => onChange({ ...data, password })}
        secureTextEntry
        error={errors?.password}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
});
