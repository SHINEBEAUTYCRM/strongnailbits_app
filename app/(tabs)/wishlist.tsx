import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, Trash2 } from 'lucide-react-native';
import { colors, fontSizes, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useWishlistStore } from '@/stores/wishlist';
import { ProductGrid } from '@/components/product/ProductGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ProductListItem } from '@/types/product';

export default function WishlistScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const items = useWishlistStore((s) => s.items);
  const clearAll = useWishlistStore((s) => s.clearAll);

  // Convert wishlist items to ProductListItem format for ProductGrid
  const products: ProductListItem[] = useMemo(
    () =>
      items.map((item) => ({
        id: item.product_id,
        slug: item.slug,
        name_uk: item.name,
        name_ru: null,
        price: item.price,
        old_price: item.old_price,
        main_image_url: item.image,
        quantity: 99, // assume in stock
        status: 'active',
        is_new: false,
        is_featured: false,
        brand_id: null,
      })),
    [items]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === 'ru' ? 'Избранное' : 'Обране'}
        </Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearAll}>
            <Trash2 size={20} color={colors.red} />
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon={<Heart size={64} color={colors.darkTertiary} />}
          title={language === 'ru' ? 'Список желаний пуст' : 'Список бажань порожній'}
          actionTitle={language === 'ru' ? 'Перейти в каталог' : 'Перейти до каталогу'}
          onAction={() => router.push('/(tabs)/catalog')}
        />
      ) : (
        <ProductGrid products={products} />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
  },
});
