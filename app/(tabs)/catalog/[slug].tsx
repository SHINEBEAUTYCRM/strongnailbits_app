import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, SlidersHorizontal, ArrowUpDown, X, ChevronRight } from 'lucide-react-native';
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

function SubcategoryList({
  subcategories,
  tField,
  onPress,
}: {
  subcategories: any[];
  tField: (uk: string, ru: string) => string;
  onPress: (slug: string) => void;
}) {
  return (
    <View style={styles.subcatsList}>
      {subcategories.map((sub: any, index: number) => (
        <TouchableOpacity
          key={sub.id}
          style={[
            styles.subcatRow,
            index < subcategories.length - 1 && styles.subcatRowBorder,
          ]}
          onPress={() => onPress(sub.slug)}
          activeOpacity={0.6}
        >
          <Text style={styles.subcatRowName}>
            {tField(sub.name_uk, sub.name_ru)}
          </Text>
          <View style={styles.subcatRowRight}>
            {sub.product_count > 0 && (
              <Text style={styles.subcatRowCount}>{sub.product_count}</Text>
            )}
            <ChevronRight size={18} color={colors.darkTertiary} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

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
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const currentInTree = useMemo(() => {
    function findInTree(nodes: any[], targetSlug: string): any {
      for (const node of nodes) {
        if (node.slug === targetSlug) return node;
        if (node.children?.length) {
          const found = findInTree(node.children, targetSlug);
          if (found) return found;
        }
      }
      return null;
    }
    return slug ? findInTree(tree, slug as string) : null;
  }, [tree, slug]);

  const subcategories = (currentInTree?.children || []).filter(
    (c: any) => c.product_count > 0
  );

  const parentCategory = useMemo(() => {
    if (!currentCategory?.parent_cs_cart_id) return null;
    return categories.find((c: any) => c.cs_cart_id === currentCategory.parent_cs_cart_id) || null;
  }, [currentCategory, categories]);

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

      {/* Breadcrumb */}
      {parentCategory && (
        <TouchableOpacity
          style={styles.breadcrumb}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.breadcrumbText}>
            ← {parentCategory.name_uk}
          </Text>
        </TouchableOpacity>
      )}

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {totalCount} {getProductWord(totalCount, language)}
        </Text>
        <View style={styles.toolbarActions}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setSortModalVisible(true)}
          >
            <ArrowUpDown size={18} color={colors.dark} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setFilterModalVisible(true)}
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
        onRefresh={async () => {
          setRefreshing(true);
          await refresh();
          setRefreshing(false);
        }}
        refreshing={refreshing}
        ListHeaderComponent={
          subcategories.length > 0 ? (
            <SubcategoryList
              subcategories={subcategories}
              tField={tField}
              onPress={(subSlug: string) => router.push(`/(tabs)/catalog/${subSlug}`)}
            />
          ) : undefined
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Package size={48} color={colors.darkTertiary} />}
            title={language === 'ru' ? 'Товары не найдены' : 'Товари не знайдено'}
            subtitle={language === 'ru' ? 'Попробуйте изменить фильтры' : 'Спробуйте змінити фільтри'}
          />
        }
      />

      {/* Sort Modal */}
      <Modal
        visible={sortModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ width: 24 }} />
            <View style={styles.modalHandle} />
            <TouchableOpacity onPress={() => setSortModalVisible(false)}>
              <X size={24} color={colors.dark} />
            </TouchableOpacity>
          </View>
          <SortSheet
            current={sort}
            onSelect={setSort}
            onClose={() => setSortModalVisible(false)}
          />
        </SafeAreaView>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ width: 24 }} />
            <View style={styles.modalHandle} />
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <X size={24} color={colors.dark} />
            </TouchableOpacity>
          </View>
          <FilterSheet
            brands={brands}
            initialFilters={filters}
            onApply={setFilters}
            onReset={() =>
              setFilters({ brandIds: [], inStock: false })
            }
            onClose={() => setFilterModalVisible(false)}
          />
        </SafeAreaView>
      </Modal>
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breadcrumbText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.coral,
  },
  subcatsList: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.sm,
  },
  subcatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
  },
  subcatRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  subcatRowName: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
    marginRight: spacing.sm,
  },
  subcatRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subcatRowCount: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
  },
});
