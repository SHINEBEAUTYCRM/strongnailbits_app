import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { colors, fontSizes, borderRadius, spacing, shadows } from '@/theme';

const FEATURES = [
  { icon: '🚚', text: 'Безкоштовна доставка від 2500₴' },
  { icon: '💰', text: 'Оптові ціни від 1 одиниці' },
  { icon: '🔄', text: 'Обмін та повернення 14 днів' },
  { icon: '✅', text: 'Тільки оригінальна продукція' },
  { icon: '📦', text: 'Відправка в день замовлення' },
];

export function Features() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FEATURES.map((feature, index) => (
        <View key={index} style={[styles.card, shadows.sm]}>
          <Text style={styles.icon}>{feature.icon}</Text>
          <Text style={styles.text}>{feature.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: 160,
    gap: spacing.sm,
  },
  icon: {
    fontSize: 28,
  },
  text: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
    lineHeight: 18,
  },
});
