import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/hooks/useLanguage';
import { spacing, fontSizes, colors } from '@/theme';

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
  email: string;
}

interface ProfileFormProps {
  data: ProfileData;
  onChange: (data: ProfileData) => void;
}

export function ProfileForm({ data, onChange }: ProfileFormProps) {
  const { language } = useLanguage();

  return (
    <View style={styles.container}>
      <Input
        label={language === 'ru' ? 'Имя' : "Ім'я"}
        value={data.firstName}
        onChangeText={(firstName) => onChange({ ...data, firstName })}
      />
      <Input
        label={language === 'ru' ? 'Фамилия' : 'Прізвище'}
        value={data.lastName}
        onChangeText={(lastName) => onChange({ ...data, lastName })}
      />
      <Input
        label={language === 'ru' ? 'Телефон' : 'Телефон'}
        value={data.phone}
        editable={false}
      />
      <View>
        <Input
          label="Email"
          value={data.email}
          onChangeText={(email) => onChange({ ...data, email })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.hint}>
          {language === 'ru'
            ? 'Для получения чеков и уведомлений'
            : 'Для отримання чеків та повідомлень'}
        </Text>
      </View>
      <Input
        label={language === 'ru' ? 'Компания' : 'Компанія'}
        value={data.company}
        onChangeText={(company) => onChange({ ...data, company })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  hint: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
    marginTop: 4,
    paddingHorizontal: 4,
  },
});
