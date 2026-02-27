import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ShoppingCart } from 'lucide-react-native';
import { supabase } from '@/lib/supabase/client';
import { colors, spacing, fontSizes } from '@/theme';
import { useCartStore } from '@/stores/cart';
import { trackPageView } from '@/lib/analytics/tracker';
import { HeroBanner } from '@/components/home/HeroBanner';
import { QuickCategories } from '@/components/home/QuickCategories';
import { ProductSection } from '@/components/home/ProductSection';
import { Features } from '@/components/home/Features';
import { B2BCta } from '@/components/home/B2BCta';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import type { ProductListItem, Category } from '@/types/product';

const PRODUCT_SELECT =
  'id, slug, name_uk, name_ru, price, old_price, main_image_url, quantity, status, is_new, is_featured, brands(name, slug)';

export default function HomeScreen() {
  const router = useRouter();
  const cartCount = useCartStore((s) => s.getCount());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<ProductListItem[]>([]);
  const [sale, setSale] = useState<ProductListItem[]>([]);
  const [newest, setNewest] = useState<ProductListItem[]>([]);

  useEffect(() => {
    trackPageView('/', 'Home');
    loadData();
  }, []);

  async function loadData() {
    try {
      const [bannersRes, categoriesRes, popularRes, saleRes, newestRes] =
        await Promise.all([
          supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .in('target', ['mobile', 'all'])
            .order('position'),
          supabase
            .from('categories')
            .select('id, slug, name_uk, name_ru, image_url, product_count, parent_cs_cart_id')
            .eq('status', 'active')
            .is('parent_cs_cart_id', null)
            .order('position'),
          supabase
            .from('products')
            .select(PRODUCT_SELECT)
            .eq('status', 'active')
            .gt('quantity', 0)
            .order('quantity', { ascending: false })
            .limit(20),
          supabase
            .from('products')
            .select(PRODUCT_SELECT)
            .eq('status', 'active')
            .not('old_price', 'is', null)
            .gt('old_price', 0)
            .limit(20),
          supabase
            .from('products')
            .select(PRODUCT_SELECT)
            .eq('status', 'active')
            .gt('quantity', 0)
            .order('created_at', { ascending: false })
            .limit(20),
        ]);

      setBanners(bannersRes.data ?? []);
      setCategories((categoriesRes.data ?? []) as Category[]);
      setPopular((popularRes.data ?? []) as ProductListItem[]);
      setSale((saleRes.data ?? []) as ProductListItem[]);
      setNewest((newestRes.data ?? []) as ProductListItem[]);
    } catch (err) {
      console.error('Failed to load home data:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) return <Loading fullScreen />;

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ErrorState
          fullScreen
          onRetry={() => {
            setError(false);
            setIsLoading(true);
            loadData();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.logoShine}>SHINE </Text>
          <Text style={styles.logoShop}>SHOP</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push('/search')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Search size={24} color={colors.dark} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/cart')}
            style={styles.cartIconWrapper}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ShoppingCart size={24} color={colors.dark} />
            {cartCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={0.7}
        >
          <Search size={20} color={colors.darkTertiary} />
          <Text style={styles.searchPlaceholder}>Пошук товарів...</Text>
        </TouchableOpacity>

        {/* Quick Categories */}
        <QuickCategories categories={categories} />

        {/* Hero Banner */}
        {banners.length > 0 && <HeroBanner banners={banners} />}

        {/* Popular */}
        <ProductSection
          title="Популярні"
          products={popular}
          seeAllLink="/(tabs)/catalog"
        />

        {/* Sale */}
        {sale.length > 0 && (
          <ProductSection title="Розпродаж" products={sale} />
        )}

        {/* New */}
        <ProductSection title="Новинки" products={newest} />

        {/* Features */}
        <Features />

        {/* B2B CTA */}
        <B2BCta />
      </ScrollView>
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
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  logoShine: {
    fontSize: 20,
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
  },
  logoShop: {
    fontSize: 20,
    fontFamily: 'Unbounded-Bold',
    color: '#E11D48',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
  },
  cartIconWrapper: {
    position: 'relative',
  },
  headerBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: colors.coral,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    lineHeight: 14,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sand,
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    height: 44,
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
  },
});
