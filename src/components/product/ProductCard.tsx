import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Heart, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, fontSizes, borderRadius, spacing, shadows } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useCartStore } from '@/stores/cart';
import { useWishlistStore } from '@/stores/wishlist';
import { formatPrice, formatDiscount } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { trackAddToCart } from '@/lib/analytics/tracker';
import type { ProductListItem } from '@/types/product';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / 2;
const IMAGE_SIZE = CARD_WIDTH;

interface ProductCardProps {
  product: ProductListItem;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { tField } = useLanguage();
  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const hasInWishlist = useWishlistStore((s) => s.hasItem(product.id));
  const { showToast } = useToast();

  const name = tField(product.name_uk, product.name_ru);
  const isOutOfStock = product.quantity <= 0;
  const discount = product.old_price ? formatDiscount(product.price, product.old_price) : '';

  const handlePress = useCallback(() => {
    router.push(`/product/${product.slug}`);
  }, [product.slug]);

  const handleAddToCart = useCallback(() => {
    if (isOutOfStock) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToCart({
      product_id: product.id,
      name,
      slug: product.slug,
      image: product.main_image_url ?? '',
      price: product.price,
      old_price: product.old_price,
      quantity: 1,
      sku: '',
      max_quantity: product.quantity,
      weight: 0,
    });
    trackAddToCart(product.id, name, product.price);
    showToast('Додано в кошик', 'success');
  }, [product, name, isOutOfStock]);

  const handleToggleWishlist = useCallback(() => {
    Haptics.selectionAsync();
    toggleWishlist({
      product_id: product.id,
      name,
      slug: product.slug,
      image: product.main_image_url ?? '',
      price: product.price,
      old_price: product.old_price,
      added_at: new Date().toISOString(),
    });
  }, [product, name]);

  return (
    <TouchableOpacity
      style={[styles.card, shadows.sm]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.main_image_url ?? undefined }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          placeholder={require('../../../assets/images/icon.png')}
        />

        {/* Badges */}
        <View style={styles.badges}>
          {discount ? <Badge text={discount} variant="coral" size="sm" /> : null}
          {product.is_new ? <Badge text="NEW" variant="violet" size="sm" /> : null}
          {product.is_featured ? <Badge text="HIT" variant="coral" size="sm" /> : null}
        </View>

        {/* Wishlist button */}
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={handleToggleWishlist}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={20}
            color={hasInWishlist ? colors.coral : colors.darkTertiary}
            fill={hasInWishlist ? colors.coral : 'transparent'}
          />
        </TouchableOpacity>

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Немає в наявності</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        {product.brands?.name && (
          <Text style={styles.brand} numberOfLines={1}>
            {product.brands.name}
          </Text>
        )}
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.old_price && product.old_price > product.price && (
            <Text style={styles.oldPrice}>{formatPrice(product.old_price)}</Text>
          )}
        </View>

        {/* Add to cart */}
        <TouchableOpacity
          style={[styles.cartButton, isOutOfStock && styles.cartButtonDisabled]}
          onPress={handleAddToCart}
          disabled={isOutOfStock}
          activeOpacity={0.7}
        >
          <ShoppingBag size={16} color={isOutOfStock ? colors.darkTertiary : '#fff'} />
          <Text style={[styles.cartButtonText, isOutOfStock && styles.cartButtonTextDisabled]}>
            {isOutOfStock ? 'Немає' : 'В кошик'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badges: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    gap: spacing.xs,
  },
  wishlistButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-SemiBold',
    color: colors.darkSecondary,
  },
  info: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  brand: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
    lineHeight: 18,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  price: {
    fontSize: fontSizes.lg,
    fontFamily: 'JetBrainsMono-Bold',
    color: colors.dark,
  },
  oldPrice: {
    fontSize: fontSizes.sm,
    fontFamily: 'JetBrainsMono-Regular',
    color: colors.darkTertiary,
    textDecorationLine: 'line-through',
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.coral,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  cartButtonDisabled: {
    backgroundColor: colors.sand,
  },
  cartButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  cartButtonTextDisabled: {
    color: colors.darkTertiary,
  },
});
