import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import type { Category } from '@/types/product';

const CIRCLE_SIZE = 64;

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
          style={styles.item}
          onPress={() => router.push(`/(tabs)/catalog/${category.slug}`)}
          activeOpacity={0.7}
        >
          <View style={styles.circle}>
            {category.image_url ? (
              <Image
                source={{ uri: category.image_url }}
                style={styles.circleImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.circlePlaceholder} />
            )}
          </View>
          <Text style={styles.label} numberOfLines={2}>
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
    gap: spacing.md,
  },
  item: {
    alignItems: 'center',
    width: 72,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.sand,
    overflow: 'hidden',
  },
  circleImage: {
    width: '100%',
    height: '100%',
  },
  circlePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.sand,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
});
