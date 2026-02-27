import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { ArrowLeft, Heart, Share2, Copy } from 'lucide-react-native';
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
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatPrice, formatDiscount } from '@/utils/format';
import { trackViewItem, trackAddToCart } from '@/lib/analytics/tracker';
import type { Product, ProductListItem } from '@/types/product';

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  console.log('slug:', slug);
  const router = useRouter();
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Товар не знайдено');
      setIsLoading(false);
      return;
    }
    loadProduct();
  }, [slug]);

  async function loadProduct() {
    setIsLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      setIsLoading(false);
      setError('Завантаження тривало занадто довго. Спробуйте ще раз.');
    }, 10000);

    try {
      const { data } = await supabase
        .from('products')
        .select(`
          id, slug, name_uk, name_ru, sku, description_uk, description_ru,
          price, old_price, wholesale_price, quantity, status,
          images, main_image_url, weight, properties,
          is_new, is_featured, created_at, updated_at,
          category_id, categories(id, slug, name_uk, name_ru),
          brand_id, brands(id, name, slug, logo_url)
        `)
        .eq('slug', slug)
        .single();

      clearTimeout(timeout);

      if (!data) {
        setError('Товар не знайдено');
        return;
      }

      const prod = data as unknown as Product;
      setProduct(prod);
      trackViewItem(prod.id, prod.name_uk);

      if (prod.category_id) {
        const { data: rel } = await supabase
          .from('products')
          .select('id, slug, name_uk, name_ru, price, old_price, main_image_url, quantity, status, is_new, is_featured')
          .eq('category_id', prod.category_id)
          .neq('id', prod.id)
          .eq('status', 'active')
          .limit(10);
        setRelated((rel ?? []) as ProductListItem[]);
      }

      if (user) {
        const { data: bp } = await supabase
          .from('customer_prices')
          .select('price')
          .eq('profile_id', user.id)
          .eq('product_id', prod.id)
          .single();
        if (bp) setB2bPrice(bp.price);
      }
    } catch (err) {
      clearTimeout(timeout);
      console.error('Failed to load product:', err);
      setError('Не вдалося завантажити товар. Спробуйте ще раз.');
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }

  if (isLoading) return <Loading fullScreen />;

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.dark} />
          </TouchableOpacity>
        </View>
        <ErrorState
          fullScreen
          title={error ?? 'Товар не знайдено'}
          onRetry={slug ? loadProduct : undefined}
        />
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.dark} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
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
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gallery */}
        <ProductGallery images={images} name={name} />

        {/* Info */}
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

          {/* Status */}
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

          {/* Description */}
          {description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'ru' ? 'Описание' : 'Опис'}
              </Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          )}

          {/* Properties */}
          {product.properties && Object.keys(product.properties).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'ru' ? 'Характеристики' : 'Характеристики'}
              </Text>
              {Object.entries(product.properties).map(([key, value]) => (
                <View key={key} style={styles.propRow}>
                  <Text style={styles.propKey}>{key}</Text>
                  <Text style={styles.propValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Related Products */}
        <RelatedProducts products={related} />
      </ScrollView>

      {/* Sticky Buy Bar */}
      <View style={[styles.buyBar, shadows.lg]}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(displayPrice)}</Text>
          {product.old_price && product.old_price > displayPrice && (
            <Text style={styles.oldPrice}>{formatPrice(product.old_price)}</Text>
          )}
          {b2bPrice && (
            <Badge text="B2B" variant="violet" size="sm" />
          )}
        </View>
        <View style={styles.buyActions}>
          <QuantitySelector
            value={quantity}
            max={product.quantity}
            onChange={setQuantity}
            size="sm"
          />
          <Button
            title={isOutOfStock ? 'Немає' : 'Додати в кошик'}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
            size="md"
          />
        </View>
      </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  info: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  brand: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.coral,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: fontSizes.xl,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
    lineHeight: 28,
  },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
  },
  description: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    lineHeight: 22,
  },
  propRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  propKey: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    flex: 1,
  },
  propValue: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
    flex: 1,
    textAlign: 'right',
  },
  buyBar: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.md,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  price: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'JetBrainsMono-Bold',
    color: colors.dark,
  },
  oldPrice: {
    fontSize: fontSizes.md,
    fontFamily: 'JetBrainsMono-Regular',
    color: colors.darkTertiary,
    textDecorationLine: 'line-through',
  },
  buyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
