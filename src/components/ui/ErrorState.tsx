import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { colors, fontSizes, spacing, borderRadius } from '@/theme';

interface ErrorStateProps {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorState({
  title = 'Помилка завантаження',
  subtitle = 'Перевірте інтернет-з\'єднання та спробуйте ще раз',
  onRetry,
  fullScreen = false,
}: ErrorStateProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <AlertCircle size={40} color={colors.red} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <RefreshCw size={16} color={colors.coral} />
          <Text style={styles.buttonText}>Спробувати ще</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing['2xl'],
    gap: spacing.sm,
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSizes.lg,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.coral,
    marginTop: spacing.md,
  },
  buttonText: {
    color: colors.coral,
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
  },
});
