import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';

interface BadgeProps {
  text: string;
  variant?: 'coral' | 'violet' | 'green' | 'amber' | 'red' | 'custom';
  color?: string;
  backgroundColor?: string;
  size?: 'sm' | 'md';
}

export function Badge({
  text,
  variant = 'coral',
  color,
  backgroundColor,
  size = 'sm',
}: BadgeProps) {
  const variantColors: Record<string, { bg: string; text: string }> = {
    coral: { bg: colors.coral, text: '#fff' },
    violet: { bg: colors.violet, text: '#fff' },
    green: { bg: colors.green, text: '#fff' },
    amber: { bg: colors.amber, text: '#fff' },
    red: { bg: colors.red, text: '#fff' },
  };

  const vc = variantColors[variant] ?? variantColors.coral;

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: backgroundColor ?? vc.bg },
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: color ?? vc.text },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontFamily: 'Inter-Bold',
  },
  textSm: {
    fontSize: fontSizes.xs,
  },
  textMd: {
    fontSize: fontSizes.sm,
  },
});
