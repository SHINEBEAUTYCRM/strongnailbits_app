import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, Text, RefreshControl } from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
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
import { SkeletonBanner, SkeletonSection } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { CategoryBlockCard } from '@/components/home/CategoryBlockCard';
import { PromoStrip } from '@/components/home/PromoStrip';
import { DealOfDaySection } from '@/components/home/DealOfDaySection';
import { FloatingPetals, isMarch8Season } from '@/components/seasonal';
import { sortByPriority } from '@/hooks/useProducts';
import type { ProductListItem, Category } from '@/types/product';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

interface CategoryBlockChild {
  id: string;
  slug: string;
  name_uk: string;
  name_ru: string | null;
  image_url: string | null;
  product_count: number;
}

interface CategoryBlockData {
  id: string;
  title_uk: string;
  title_ru: string | null;
  subtitle_uk: string | null;
  subtitle_ru: string | null;
  parent_slug: string;
  show_on_app: boolean;
  children: CategoryBlockChild[];
}

interface DealData {
  id: string;
  end_at: string;
  is_enabled: boolean;
  products: any[];
}

const PRODUCT_SELECT =
  'id, slug, name_uk, name_ru, price, old_price, main_image_url, quantity, status, is_new, is_featured, brands(name, slug)';

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const cartCount = useCartStore((s) => s.getCount());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<ProductListItem[]>([]);
  const [sale, setSale] = useState<ProductListItem[]>([]);
  const [newest, setNewest] = useState<ProductListItem[]>([]);
  const [categoryBlocks, setCategoryBlocks] = useState<CategoryBlockData[]>([]);
  const [promo, setPromo] = useState<any[]>([]);
  const [dealData, setDealData] = useState<DealData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    trackPageView('/', 'Home');
    loadData();
  }, []);

  async function loadDataFallback() {
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
      setPopular(sortByPriority((popularRes.data ?? []) as ProductListItem[]));
      setSale(sortByPriority((saleRes.data ?? []) as ProductListItem[]));
      setNewest(sortByPriority((newestRes.data ?? []) as ProductListItem[]));
    } catch (err) {
      console.error('Failed to load home data:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadData() {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://shineshopb2b.com';
      const res = await fetch(`${API_URL}/api/app/home`, {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      if (!data || typeof data !== 'object') throw new Error('Invalid response');

      setBanners(data.banners || []);
      setPromo(data.promo || []);

      const cats = (data.quickCategories || [])
        .map((qc: any) => qc.categories)
        .filter(Boolean);
      setCategories(cats.length > 0 ? cats : []);

      const appBlocks = (data.categoryBlocks || []).filter((b: any) => b.show_on_app);
      setCategoryBlocks(appBlocks);
      setDealData(data.deal || null);

      const [popularRes, saleRes, newestRes] = await Promise.all([
        supabase.from('products').select(PRODUCT_SELECT)
          .eq('status', 'active').gt('quantity', 0)
          .order('quantity', { ascending: false }).limit(20),
        supabase.from('products').select(PRODUCT_SELECT)
          .eq('status', 'active').not('old_price', 'is', null)
          .gt('old_price', 0).limit(20),
        supabase.from('products').select(PRODUCT_SELECT)
          .eq('status', 'active').gt('quantity', 0)
          .order('created_at', { ascending: false }).limit(20),
      ]);

      setPopular(sortByPriority((popularRes.data ?? []) as ProductListItem[]));
      setSale(sortByPriority((saleRes.data ?? []) as ProductListItem[]));
      setNewest(sortByPriority((newestRes.data ?? []) as ProductListItem[]));

    } catch (apiError) {
      console.warn('[Home] API failed, using fallback:', apiError);
      await loadDataFallback();
    } finally {
      setIsLoading(false);
    }
  }

  // Glass header scroll tracking
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(255, 255, 255, ${interpolate(
      scrollY.value,
      [0, 30],
      [1, 0.85],
      Extrapolation.CLAMP,
    )})`,
    borderBottomWidth: interpolate(
      scrollY.value,
      [0, 10],
      [0, 0.5],
      Extrapolation.CLAMP,
    ),
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    shadowOpacity: interpolate(
      scrollY.value,
      [0, 20],
      [0, 0.08],
      Extrapolation.CLAMP,
    ),
  }));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.logoShine}>SHINE</Text>
            <Text style={styles.logoShop}>SHOP</Text>
          </View>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <SkeletonBanner />
          <SkeletonSection />
          <SkeletonSection />
        </ScrollView>
      </SafeAreaView>
    );
  }

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

  const showSeasonal = isMarch8Season();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {showSeasonal && <FloatingPetals />}

      {/* Glass Header */}
      <Animated.View style={[styles.header, styles.headerShadow, headerAnimatedStyle]}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text style={styles.logoShine}>SHINE</Text>
          <Text style={styles.logoShop}>SHOP</Text>
          {showSeasonal && <Text style={styles.seasonalFlower}>🌸</Text>}
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
      </Animated.View>

      <AnimatedScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.coral]} tintColor={colors.coral} />
        }
      >
        {/* Promo Strip */}
        {promo.length > 0 && <PromoStrip banner={promo[0]} />}

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={0.7}
        >
          <Search size={20} color={colors.darkTertiary} />
          <Text style={styles.searchPlaceholder}>Пошук товарів...</Text>
        </TouchableOpacity>

        <QuickCategories categories={categories} />

        {banners.length > 0 && <HeroBanner banners={banners} />}

        {categoryBlocks.map((block) => (
          <CategoryBlockCard key={block.id} block={block} />
        ))}

        {dealData && dealData.products && dealData.products.length > 0 && (
          <DealOfDaySection deal={dealData} />
        )}

        <ProductSection
          title="Популярні"
          products={popular}
          seeAllLink="/(tabs)/catalog"
        />

        {sale.length > 0 && (
          <ProductSection title="Розпродаж" products={sale} />
        )}

        <ProductSection title="Новинки" products={newest} />

        <Features />

        <B2BCta />
      </AnimatedScrollView>
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
    zIndex: 10,
  },
  headerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  logoShine: {
    fontSize: 20,
    fontFamily: 'Unbounded-Black',
    color: '#1a1a1a',
  },
  logoShop: {
    fontSize: 20,
    fontFamily: 'Unbounded-Black',
    color: '#D6264A',
    marginLeft: 6,
  },
  seasonalFlower: {
    fontSize: 16,
    marginLeft: 4,
    marginBottom: -2,
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
