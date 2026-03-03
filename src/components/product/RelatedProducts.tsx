import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { ProductCard } from './ProductCard';
import { colors, fontSizes, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import type { ProductListItem } from '@/types/product';

interface RelatedProductsProps {
  products: ProductListItem[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  const { language } = useLanguage();

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {language === 'ru' ? 'Похожие товары' : 'Схожі товари'}
      </Text>
      <FlatList
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ProductCard product={item} compact />
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  cardWrapper: {
    marginRight: spacing.md,
  },
});
