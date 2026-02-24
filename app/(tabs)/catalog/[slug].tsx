import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { ArrowLeft, SlidersHorizontal, ArrowUpDown } from 'lucide-react-native';
import { colors, fontSizes, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useCategoryTree, getDescendantIds } from '@/hooks/useCategoryTree';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/lib/supabase/client';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FilterSheet } from '@/components/catalog/FilterSheet';
import { SortSheet } from '@/components/catalog/SortSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Package } from 'lucide-react-native';
import { getProductWord } from '@/utils/format';
import type { CatalogFilters, SortOption } from '@/types/product';

export default function CategoryProductsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { language, tField } = useLanguage();
  const { categories, tree } = useCategoryTree();

  const [sort, setSort] = useState<SortOption>('popular');
  const [filters, setFilters] = useState<CatalogFilters>({
    brandIds: [],
    inStock: false,
  });
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);

  const sortSheetRef = useRef<BottomSheet>(null);
  const filterSheetRef = useRef<BottomSheet>(null);

  // Find current category
  const currentCategory = useMemo(
    () => categories.find((c) => c.slug === slug),
    [categories, slug]
  );

  // Get all descendant IDs
  const categoryIds = useMemo(
    () => (slug ? getDescendantIds(tree, slug) : []),
    [tree, slug]
  );

  // Load brands for this category
  useEffect(() => {
    async function loadBrands() {
      if (!categoryIds.length) return;
      try {
        const { data } = await supabase
          .from('products')
          .select('brand_id, brands(id, name)')
          .eq('status', 'active')
          .in('category_id', categoryIds)
          .not('brand_id', 'is', null);

        if (data) {
          const brandMap = new Map<string, { id: string; name: string }>();
          for (const p of data) {
            const brand = (p as any).brands;
            if (brand?.id && brand?.name && !brandMap.has(brand.id)) {
              brandMap.set(brand.id, { id: brand.id, name: brand.name });
            }
          }
          setBrands(Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (e) {
        console.error('Failed to load brands:', e);
      }
    }
    loadBrands();
  }, [categoryIds]);

  const { products, totalCount, isLoading, isLoadingMore, loadMore, refresh } =
    useProducts({
      categoryIds,
      brandIds: filters.brandIds,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      inStock: filters.inStock,
      sort,
      enabled: categoryIds.length > 0,
    });

  const categoryName = currentCategory
    ? tField(currentCategory.name_uk, currentCategory.name_ru)
    : slug;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {categoryName}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {totalCount} {getProductWord(totalCount, language)}
        </Text>
        <View style={styles.toolbarActions}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => sortSheetRef.current?.expand()}
          >
            <ArrowUpDown size={18} color={colors.dark} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => filterSheetRef.current?.expand()}
          >
            <SlidersHorizontal size={18} color={colors.dark} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Products Grid */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        onEndReached={loadMore}
        onRefresh={refresh}
        refreshing={false}
        ListEmptyComponent={
          <EmptyState
            icon={<Package size={48} color={colors.darkTertiary} />}
            title={language === 'ru' ? 'Товары не найдены' : 'Товари не знайдено'}
            subtitle={language === 'ru' ? 'Попробуйте изменить фильтры' : 'Спробуйте змінити фільтри'}
          />
        }
      />

      {/* Sort Bottom Sheet */}
      <BottomSheet
        ref={sortSheetRef}
        index={-1}
        snapPoints={['40%']}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <SortSheet
          current={sort}
          onSelect={setSort}
          onClose={() => sortSheetRef.current?.close()}
        />
      </BottomSheet>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        ref={filterSheetRef}
        index={-1}
        snapPoints={['70%']}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <FilterSheet
          brands={brands}
          initialFilters={filters}
          onApply={setFilters}
          onReset={() =>
            setFilters({ brandIds: [], inStock: false })
          }
          onClose={() => filterSheetRef.current?.close()}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pearl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.lg,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
    marginHorizontal: spacing.md,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  count: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  toolbarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetBackground: {
    backgroundColor: colors.white,
  },
  sheetHandle: {
    backgroundColor: colors.border,
    width: 40,
  },
});
