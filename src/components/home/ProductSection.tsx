import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ProductCard } from '@/components/product/ProductCard';
import { colors, spacing } from '@/theme';
import type { ProductListItem } from '@/types/product';

interface ProductSectionProps {
  title: string;
  products: ProductListItem[];
  seeAllLink?: string;
}

export function ProductSection({
  title,
  products,
  seeAllLink,
}: ProductSectionProps) {
  const router = useRouter();

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {seeAllLink && (
          <TouchableOpacity
            style={styles.seeAll}
            onPress={() => router.push(seeAllLink as never)}
          >
            <Text style={styles.seeAllText}>Дивитись всі</Text>
            <ChevronRight size={16} color={colors.coral} />
          </TouchableOpacity>
        )}
      </View>
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
    paddingVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.coral,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  cardWrapper: {},
});
