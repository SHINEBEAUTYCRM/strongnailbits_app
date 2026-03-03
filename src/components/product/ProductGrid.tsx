import React from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { ProductCard } from './ProductCard';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import { colors, spacing } from '@/theme';
import type { ProductListItem } from '@/types/product';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = spacing.sm;
const HORIZONTAL_PADDING = spacing.lg;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

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
  return (
    <FlatList
      data={isLoading ? [] : products}
      numColumns={2}
      renderItem={({ item, index }) => (
        <View style={[styles.cardWrapper, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}>
          <ProductCard product={item} index={index} />
        </View>
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      columnWrapperStyle={styles.row}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.skeletonContainer}>
            <SkeletonGrid count={6} />
          </View>
        ) : (
          ListEmptyComponent
        )
      }
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={colors.coral} />
          </View>
        ) : null
      }
      removeClippedSubviews={false}
      maxToRenderPerBatch={8}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    paddingTop: spacing.lg,
    backgroundColor: colors.pearl,
  },
  container: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: spacing['3xl'],
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  cardLeft: {
    marginRight: CARD_GAP / 2,
  },
  cardRight: {
    marginLeft: CARD_GAP / 2,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
