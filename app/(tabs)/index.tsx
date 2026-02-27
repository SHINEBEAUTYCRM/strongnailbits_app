import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bell } from 'lucide-react-native';
import { TouchableOpacity, Text } from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase/client';
import { colors, spacing, fontSizes } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
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
  const { language } = useLanguage();
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
        <Text style={styles.logo}>ShineShop</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Search size={24} color={colors.dark} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <Bell size={24} color={colors.dark} />
            {false && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
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
        {/* Hero Banner */}
        <HeroBanner banners={banners} />

        {/* Quick Categories */}
        <View style={styles.section}>
          <QuickCategories categories={categories} />
        </View>

        {/* Popular */}
        <ProductSection
          title={language === 'ru' ? 'Популярные' : 'Популярні'}
          products={popular}
          seeAllLink="/(tabs)/catalog"
        />

        {/* Sale */}
        {sale.length > 0 && (
          <ProductSection
            title={language === 'ru' ? 'Распродажа' : 'Розпродаж'}
            products={sale}
          />
        )}

        {/* New */}
        <ProductSection
          title={language === 'ru' ? 'Новинки' : 'Новинки'}
          products={newest}
        />

        {/* Features */}
        <View style={styles.section}>
          <Features />
        </View>

        {/* B2B CTA */}
        <View style={styles.section}>
          <B2BCta />
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  logo: {
    fontSize: fontSizes.xl,
    fontFamily: 'Unbounded-Bold',
    color: colors.coral,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.coral,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  section: {
    // spacing between sections handled by gap
  },
});
