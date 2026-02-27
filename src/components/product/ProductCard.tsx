import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, shadows } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useCartStore } from '@/stores/cart';
import { useWishlistStore } from '@/stores/wishlist';
import { formatPrice, formatDiscount } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';
import { trackAddToCart } from '@/lib/analytics/tracker';
import type { ProductListItem } from '@/types/product';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / 2;
const COMPACT_CARD_WIDTH = 160;

interface ProductCardProps {
  product: ProductListItem;
  compact?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  compact,
}: ProductCardProps) {
  const router = useRouter();
  const { tField } = useLanguage();
  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const hasInWishlist = useWishlistStore((s) => s.hasItem(product.id));
  const { showToast } = useToast();

  const name = tField(product.name_uk, product.name_ru);
  const isOutOfStock = product.quantity <= 0;
  const discount = product.old_price
    ? formatDiscount(product.price, product.old_price)
    : '';
  const cardWidth = compact ? COMPACT_CARD_WIDTH : GRID_CARD_WIDTH;

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
      style={[styles.card, shadows.sm, { width: cardWidth }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={[styles.imageContainer, { width: cardWidth, height: cardWidth }]}>
        <Image
          source={{ uri: product.main_image_url ?? undefined }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          placeholder={require('../../../assets/images/icon.png')}
        />

        {discount ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={handleToggleWishlist}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={18}
            color={hasInWishlist ? colors.coral : colors.darkTertiary}
            fill={hasInWishlist ? colors.coral : 'transparent'}
          />
        </TouchableOpacity>

        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Немає в наявності</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.old_price && product.old_price > product.price && (
            <Text style={styles.oldPrice}>
              {formatPrice(product.old_price)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.cartButton, isOutOfStock && styles.cartButtonDisabled]}
          onPress={handleAddToCart}
          disabled={isOutOfStock}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.cartButtonText,
              isOutOfStock && styles.cartButtonTextDisabled,
            ]}
          >
            {isOutOfStock ? 'Немає' : 'В кошик'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.coral,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter-Bold',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
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
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: colors.darkSecondary,
  },
  info: {
    padding: 10,
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
    lineHeight: 17,
    minHeight: 34,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontFamily: 'JetBrainsMono-Bold',
    color: colors.dark,
  },
  oldPrice: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono-Regular',
    color: colors.darkTertiary,
    textDecorationLine: 'line-through',
  },
  cartButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.coral,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 4,
  },
  cartButtonDisabled: {
    backgroundColor: colors.sand,
  },
  cartButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  cartButtonTextDisabled: {
    color: colors.darkTertiary,
  },
});
