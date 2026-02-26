import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ProductCard } from '@/components/product/ProductCard';
import { colors, fontSizes, spacing } from '@/theme';
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
            <ProductCard product={item} />
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.coral,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  cardWrapper: {
    marginRight: spacing.md,
  },
});
