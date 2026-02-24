import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Phone } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { colors } from '@/theme';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChangeText, error }: PhoneInputProps) {
  const formatPhone = (text: string) => {
    // Remove non-digits
    let digits = text.replace(/\D/g, '');

    // Ensure starts with 380
    if (digits.startsWith('0')) {
      digits = '38' + digits;
    }
    if (!digits.startsWith('380') && digits.length > 0) {
      if (!digits.startsWith('3')) digits = '380' + digits;
    }

    // Format: +380 XX XXX XX XX
    let formatted = '+';
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += ' ' + digits.slice(3, 5);
    if (digits.length > 5) formatted += ' ' + digits.slice(5, 8);
    if (digits.length > 8) formatted += ' ' + digits.slice(8, 10);
    if (digits.length > 10) formatted += ' ' + digits.slice(10, 12);

    return formatted;
  };

  const handleChange = (text: string) => {
    const formatted = formatPhone(text);
    onChangeText(formatted);
  };

  return (
    <Input
      label="Телефон"
      value={value}
      onChangeText={handleChange}
      keyboardType="phone-pad"
      placeholder="+380 XX XXX XX XX"
      leftIcon={<Phone size={20} color={colors.darkTertiary} />}
      error={error}
    />
  );
}
