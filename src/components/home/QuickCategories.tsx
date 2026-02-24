import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import type { Category } from '@/types/product';

interface QuickCategoriesProps {
  categories: Category[];
}

export function QuickCategories({ categories }: QuickCategoriesProps) {
  const router = useRouter();
  const { tField } = useLanguage();

  if (categories.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={styles.chip}
          onPress={() => router.push(`/(tabs)/catalog/${category.slug}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.chipText}>
            {tField(category.name_uk, category.name_ru)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.sand,
    borderRadius: borderRadius.pill,
  },
  chipText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
});
