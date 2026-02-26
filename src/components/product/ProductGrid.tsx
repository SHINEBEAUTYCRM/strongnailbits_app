import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ProductCard } from './ProductCard';
import { Loading } from '@/components/ui/Loading';
import { colors, spacing } from '@/theme';
import type { ProductListItem } from '@/types/product';

interface ProductGridProps {
  products: ProductListItem[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ReactElement;
}

export function ProductGrid({
  products,
  isLoading,
  isLoadingMore,
  onEndReached,
  onRefresh,
  refreshing,
  ListHeaderComponent,
  ListEmptyComponent,
}: ProductGridProps) {
  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <FlashList
      data={products}
      numColumns={2}
      estimatedItemSize={280}
      renderItem={({ item }) => (
        <View style={styles.cardWrapper}>
          <ProductCard product={item} />
        </View>
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={colors.coral} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  cardWrapper: {
    flex: 1,
    padding: spacing.sm / 2,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
