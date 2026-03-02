import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { ArrowLeft, Heart, Copy, AlertCircle, RefreshCw, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors, fontSizes, borderRadius, spacing, shadows } from '@/theme';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useCartStore } from '@/stores/cart';
import { useWishlistStore } from '@/stores/wishlist';
import { useToast } from '@/components/ui/Toast';
import { ProductGallery } from '@/components/product/ProductGallery';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { formatPrice, formatDiscount } from '@/utils/format';
import { trackViewItem, trackAddToCart } from '@/lib/analytics/tracker';
import type { Product, ProductListItem } from '@/types/product';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { language, tField } = useLanguage();
  const { showToast } = useToast();
  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const hasInWishlist = useWishlistStore((s) => s.hasItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<ProductListItem[]>([]);
  const [b2bPrice, setB2bPrice] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoadError('No slug provided');
      setIsLoading(false);
      return;
    }
    loadProduct();
  }, [slug]);

  async function loadProduct() {
    setIsLoading(true);
    setLoadError(null);
    setProduct(null);

    try {
      const { data, error: queryError } = await supabase
        .from('products')
        .select(`
          id, slug, name_uk, name_ru, sku, description_uk, description_ru,
          price, old_price, wholesale_price, quantity, status,
          images, main_image_url, weight, properties,
          is_new, is_featured, created_at, updated_at,
          category_id, categories!products_category_id_fkey(id, slug, name_uk, name_ru),
          brand_id
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (queryError) {
        setLoadError(`Query: ${queryError.message} [${queryError.code}]`);
        return;
      }

      if (!data) {
        setLoadError(`Товар не знайдено: "${slug}"`);
        return;
      }

      const [brandResult, relatedResult, b2bResult] = await Promise.all([
        data.brand_id
          ? supabase
              .from('brands')
              .select('id, name, slug, logo_url')
              .eq('id', data.brand_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        data.category_id
          ? supabase
              .from('products')
              .select('id, slug, name_uk, name_ru, price, old_price, main_image_url, quantity, status, is_new, is_featured')
              .eq('category_id', data.category_id)
              .neq('id', data.id)
              .eq('status', 'active')
              .limit(10)
          : Promise.resolve({ data: null }),
        user
          ? supabase
              .from('customer_prices')
              .select('price')
              .eq('profile_id', user.id)
              .eq('product_id', data.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const prod = { ...data, brands: brandResult.data ?? null } as unknown as Product;
      setProduct(prod);
      trackViewItem(prod.id, prod.name_uk);
      setRelated((relatedResult.data ?? []) as ProductListItem[]);
      if (b2bResult.data) setB2bPrice(b2bResult.data.price);
    } catch (error: any) {
      setLoadError(`Exception: ${error?.message || JSON.stringify(error)}`);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) return <Loading fullScreen />;

  if (!product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.pearl }} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft size={24} color={colors.dark} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={40} color="#ef4444" />
          <Text style={styles.errorTitle}>
            {loadError || 'Товар не знайдено'}
          </Text>
          <TouchableOpacity onPress={() => loadProduct()} style={styles.retryButton}>
            <RefreshCw size={16} color={colors.coral} />
            <Text style={styles.retryText}>Спробувати ще</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const name = tField(product.name_uk, product.name_ru);
  const description = tField(product.description_uk, product.description_ru);
  const isOutOfStock = product.quantity <= 0;
  const discount = product.old_price ? formatDiscount(product.price, product.old_price) : '';
  const images = (product.images ?? [product.main_image_url].filter(Boolean)).map(
    (url) => ({ url: url ?? '' })
  );
  const isWished = hasInWishlist(product.id);
  const displayPrice = b2bPrice ?? product.price;
  const hasProperties = product.properties && Object.keys(product.properties).length > 0;
  const descriptionLong = (description?.length ?? 0) > 150;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addToCart({
      product_id: product.id,
      name,
      slug: product.slug,
      image: product.main_image_url ?? '',
      price: displayPrice,
      old_price: product.old_price,
      quantity,
      sku: product.sku ?? '',
      max_quantity: product.quantity,
      weight: product.weight ?? 0,
    });
    trackAddToCart(product.id, name, displayPrice * quantity);
    showToast('Додано в кошик', 'success');
  };

  const handleCopySku = async () => {
    if (product.sku) {
      await Clipboard.setStringAsync(product.sku);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Артикул скопійовано', 'success');
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft size={24} color={colors.dark} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              Haptics.selectionAsync();
              toggleWishlist({
                product_id: product.id,
                name,
                slug: product.slug,
                image: product.main_image_url ?? '',
                price: displayPrice,
                old_price: product.old_price,
                added_at: new Date().toISOString(),
              });
            }}
          >
            <Heart
              size={24}
              color={isWished ? colors.coral : colors.dark}
              fill={isWished ? colors.coral : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        >
          {/* Gallery */}
          <ProductGallery images={images} name={name} />

          {/* Product Info */}
          <View style={styles.info}>
            {/* Brand */}
            {product.brands && (
              <Text style={styles.brand}>{product.brands.name}</Text>
            )}

            {/* Name */}
            <Text style={styles.name}>{name}</Text>

            {/* SKU */}
            {product.sku && (
              <TouchableOpacity style={styles.skuRow} onPress={handleCopySku}>
                <Text style={styles.sku}>Артикул: {product.sku}</Text>
                <Copy size={14} color={colors.darkTertiary} />
              </TouchableOpacity>
            )}

            {/* Status Badges */}
            <View style={styles.statusRow}>
              {isOutOfStock ? (
                <Badge text="Немає в наявності" variant="red" />
              ) : product.quantity < 5 ? (
                <Badge text="Закінчується" variant="amber" />
              ) : (
                <Badge text="В наявності" variant="green" />
              )}
              {discount && <Badge text={discount} variant="coral" />}
              {product.is_new && <Badge text="NEW" variant="violet" />}
            </View>

            {/* Price Section */}
            <View style={styles.priceSection}>
              <Text style={styles.priceMain}>{formatPrice(displayPrice)}</Text>
              {product.old_price && product.old_price > displayPrice && (
                <Text style={styles.priceOld}>{formatPrice(product.old_price)}</Text>
              )}
              {b2bPrice && <Badge text="B2B" variant="violet" size="sm" />}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Properties */}
          {hasProperties && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Характеристики</Text>
              {Object.entries(product.properties!).map(([key, value]) => (
                <View key={key} style={styles.propRow}>
                  <Text style={styles.propKey}>{key}</Text>
                  <View style={styles.propDots} />
                  <Text style={styles.propValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          {description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'ru' ? 'Описание' : 'Опис'}
              </Text>
              <Text
                style={styles.description}
                numberOfLines={descExpanded || !descriptionLong ? undefined : 4}
              >
                {description}
              </Text>
              {descriptionLong && (
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setDescExpanded(!descExpanded)}
                >
                  <Text style={styles.expandText}>
                    {descExpanded
                      ? (language === 'ru' ? 'Свернуть' : 'Згорнути')
                      : (language === 'ru' ? 'Показать больше' : 'Показати більше')}
                  </Text>
                  {descExpanded
                    ? <ChevronUp size={16} color={colors.coral} />
                    : <ChevronDown size={16} color={colors.coral} />}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Related Products */}
          {related.length > 0 && (
            <>
              <View style={styles.divider} />
              <RelatedProducts products={related} />
            </>
          )}
        </ScrollView>

        {/* Sticky Buy Bar */}
        <View style={[styles.buyBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.buyBarTop}>
            <View style={styles.buyBarPrice}>
              <Text style={styles.buyPrice}>{formatPrice(displayPrice)}</Text>
              {product.old_price && product.old_price > displayPrice && (
                <Text style={styles.buyOldPrice}>{formatPrice(product.old_price)}</Text>
              )}
            </View>
            {!isOutOfStock && (
              <QuantitySelector
                value={quantity}
                max={product.quantity}
                onChange={setQuantity}
                size="sm"
              />
            )}
          </View>
          <TouchableOpacity
            style={[styles.addToCartBtn, isOutOfStock && styles.addToCartDisabled]}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
            activeOpacity={0.8}
          >
            {!isOutOfStock && <ShoppingCart size={20} color="#fff" />}
            <Text style={styles.addToCartText}>
              {isOutOfStock ? 'Немає в наявності' : 'Додати в кошик'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pearl,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  info: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  brand: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-SemiBold',
    color: colors.coral,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  name: {
    fontSize: fontSizes.lg,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
    lineHeight: 26,
  },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  sku: {
    fontSize: fontSizes.xs,
    fontFamily: 'JetBrainsMono-Regular',
    color: colors.darkTertiary,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  priceMain: {
    fontSize: 28,
    fontFamily: 'JetBrainsMono-Bold',
    color: colors.dark,
  },
  priceOld: {
    fontSize: fontSizes.lg,
    fontFamily: 'JetBrainsMono-Regular',
    color: colors.darkTertiary,
    textDecorationLine: 'line-through',
  },
  divider: {
    height: 8,
    backgroundColor: colors.sand,
  },
  section: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  propRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  propKey: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
  },
  propDots: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    borderStyle: 'dotted',
    marginHorizontal: spacing.sm,
  },
  propValue: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
    maxWidth: SCREEN_WIDTH * 0.4,
    textAlign: 'right',
  },
  description: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    lineHeight: 22,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  expandText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.coral,
  },
  buyBar: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
    ...shadows.lg,
  },
  buyBarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buyBarPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  buyPrice: {
    fontSize: fontSizes.xl,
    fontFamily: 'JetBrainsMono-Bold',
    color: colors.dark,
  },
  buyOldPrice: {
    fontSize: fontSizes.sm,
    fontFamily: 'JetBrainsMono-Regular',
    color: colors.darkTertiary,
    textDecorationLine: 'line-through',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.coral,
    borderRadius: borderRadius.full,
    height: 52,
  },
  addToCartDisabled: {
    backgroundColor: colors.darkTertiary,
    opacity: 0.5,
  },
  addToCartText: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: spacing.md,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: fontSizes.sm,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.coral,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.coral,
    fontFamily: 'Inter-Medium',
    fontSize: fontSizes.sm,
  },
});
