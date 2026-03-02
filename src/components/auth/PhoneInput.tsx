import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChangeText, error }: PhoneInputProps) {
  const extractLocal = (raw: string): string => {
    let d = raw.replace(/\D/g, '');
    if (d.startsWith('380')) d = d.slice(3);
    else if (d.startsWith('80') && d.length > 9) d = d.slice(2);
    else if (d.startsWith('0')) d = d.slice(1);
    return d.slice(0, 9);
  };

  const formatLocal = (digits: string): string => {
    let f = '';
    if (digits.length > 0) f += digits.slice(0, 2);
    if (digits.length > 2) f += ' ' + digits.slice(2, 5);
    if (digits.length > 5) f += ' ' + digits.slice(5, 7);
    if (digits.length > 7) f += ' ' + digits.slice(7, 9);
    return f;
  };

  const handleChange = (text: string) => {
    const local = extractLocal(text);
    if (local.length === 0) {
      onChangeText('');
      return;
    }
    onChangeText('+380' + local);
  };

  const displayValue = formatLocal(extractLocal(value));

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Телефон</Text>
      <View style={[styles.row, error && styles.rowError]}>
        <View style={styles.prefixBox}>
          <Text style={styles.prefixText}>+380</Text>
        </View>
        <TextInput
          style={styles.input}
          value={displayValue}
          onChangeText={handleChange}
          keyboardType="phone-pad"
          placeholder="63 744 38 89"
          placeholderTextColor={colors.darkTertiary}
          maxLength={12}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
    overflow: 'hidden',
  },
  rowError: {
    borderColor: colors.red,
  },
  prefixBox: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: spacing.md,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  prefixText: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.dark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  errorText: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.red,
  },
});
