import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, spacing } from '@/theme';

export interface RegisterData {
  firstName: string;
  lastName: string;
  company: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  data: RegisterData;
  onChange: (data: RegisterData) => void;
  errors?: Partial<Record<keyof RegisterData, string>>;
}

export function RegisterForm({ data, onChange, errors }: RegisterFormProps) {
  const { language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const eyeIcon = (visible: boolean, toggle: () => void) => (
    <TouchableOpacity onPress={toggle} hitSlop={8}>
      {visible
        ? <EyeOff size={20} color={colors.darkTertiary} />
        : <Eye size={20} color={colors.darkTertiary} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Input
        label={language === 'ru' ? 'Имя *' : "Ім'я *"}
        value={data.firstName}
        onChangeText={(firstName) => onChange({ ...data, firstName })}
        error={errors?.firstName}
        autoCapitalize="words"
      />
      <Input
        label={language === 'ru' ? 'Фамилия' : 'Прізвище'}
        value={data.lastName}
        onChangeText={(lastName) => onChange({ ...data, lastName })}
        error={errors?.lastName}
        autoCapitalize="words"
      />
      <Input
        label={language === 'ru' ? 'Компания' : 'Компанія'}
        value={data.company}
        onChangeText={(company) => onChange({ ...data, company })}
        autoCapitalize="sentences"
      />
      <Input
        label={language === 'ru' ? 'Пароль *' : 'Пароль *'}
        value={data.password}
        onChangeText={(password) => onChange({ ...data, password })}
        secureTextEntry={!showPassword}
        rightIcon={eyeIcon(showPassword, () => setShowPassword(!showPassword))}
        error={errors?.password}
      />
      <Input
        label={language === 'ru' ? 'Подтвердить пароль *' : 'Підтвердити пароль *'}
        value={data.confirmPassword}
        onChangeText={(confirmPassword) => onChange({ ...data, confirmPassword })}
        secureTextEntry={!showConfirm}
        rightIcon={eyeIcon(showConfirm, () => setShowConfirm(!showConfirm))}
        error={errors?.confirmPassword}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
});
