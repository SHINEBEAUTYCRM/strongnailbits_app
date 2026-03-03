import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Heart, Check, Camera } from 'lucide-react-native';
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
const CARD_GAP = spacing.sm;
const HORIZONTAL_PADDING = spacing.lg;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;
const IMAGE_HEIGHT = GRID_CARD_WIDTH;
const COMPACT_CARD_WIDTH = 160;


interface ProductCardProps {
  product: ProductListItem;
  compact?: boolean;
  index?: number;
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

  const [addedToCart, setAddedToCart] = useState(false);
  const [imageError, setImageError] = useState(false);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Cleanup timer on unmount */
  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  const name = tField(product.name_uk, product.name_ru);
  const isOutOfStock = product.quantity <= 0;
  const discount = product.old_price
    ? formatDiscount(product.price, product.old_price)
    : '';

  const heartScale = useSharedValue(1);
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePress = useCallback(() => {
    router.push(`/product/${product.slug}`);
  }, [product.slug]);

  const handleAddToCart = useCallback(() => {
    if (isOutOfStock || addedToCart) return;
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
    setAddedToCart(true);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => setAddedToCart(false), 1500);
  }, [product, name, isOutOfStock, addedToCart]);

  const handleToggleWishlist = useCallback(() => {
    Haptics.selectionAsync();
    // Bounce heart
    heartScale.value = withSequence(
      withSpring(1.35, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
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
    <Pressable
      style={[styles.card, shadows.sm, compact && { width: COMPACT_CARD_WIDTH }]}
      onPress={handlePress}
    >
      <View style={[styles.imageContainer, { height: compact ? COMPACT_CARD_WIDTH : IMAGE_HEIGHT }]}>
        {product.main_image_url && !imageError ? (
          <Image
            source={{ uri: product.main_image_url }}
            style={styles.image}
            contentFit="contain"
            cachePolicy="memory-disk"
            recyclingKey={product.id}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.noImagePlaceholder}>
            <Camera size={28} color="#BDBDBD" />
            <Text style={styles.noImageText}>Фото готується</Text>
          </View>
        )}

        {discount ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}</Text>
          </View>
        ) : null}

        {!discount && product.is_new && (
          <View style={[styles.discountBadge, { backgroundColor: colors.green }]}>
            <Text style={styles.discountText}>NEW</Text>
          </View>
        )}

        {!discount && !product.is_new && product.is_featured && (
          <View style={[styles.discountBadge, { backgroundColor: colors.amber }]}>
            <Text style={styles.discountText}>HIT</Text>
          </View>
        )}

        <Pressable
          style={styles.wishlistButton}
          onPress={handleToggleWishlist}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Animated.View style={heartAnimatedStyle}>
            <Heart
              size={18}
              color={hasInWishlist ? colors.coral : colors.darkTertiary}
              fill={hasInWishlist ? colors.coral : 'transparent'}
            />
          </Animated.View>
        </Pressable>

        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Немає в наявності</Text>
          </View>
        )}
      </View>

      <View style={[styles.info, { minHeight: 140 }]}>
        <View style={{ minHeight: 20 }}>
          {product.brands?.name && (
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>{product.brands.name}</Text>
            </View>
          )}
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>

        <View style={{ minHeight: 18 }}>
          {!isOutOfStock && (
            <View style={styles.stockRow}>
              <View style={styles.stockDot} />
              <Text style={styles.stockText}>В наявності</Text>
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.old_price && product.old_price > product.price && (
            <Text style={styles.oldPrice}>
              {formatPrice(product.old_price)}
            </Text>
          )}
        </View>

        <Pressable
          style={[
            styles.cartButton,
            isOutOfStock && styles.cartButtonDisabled,
            addedToCart && styles.cartButtonSuccess,
          ]}
          onPress={handleAddToCart}
          disabled={isOutOfStock}
        >
          {addedToCart ? (
            <View style={styles.cartButtonRow}>
              <Check size={14} color={colors.white} />
              <Text style={styles.cartButtonText}>Додано</Text>
            </View>
          ) : (
            <Text
              style={[
                styles.cartButtonText,
                isOutOfStock && styles.cartButtonTextDisabled,
              ]}
            >
              {isOutOfStock ? 'Немає' : 'В кошик'}
            </Text>
          )}
        </Pressable>
      </View>
    </Pressable>
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
    backgroundColor: colors.pearl,
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
    color: colors.white,
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
    lineHeight: 18,
    minHeight: 36,
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
  cartButtonSuccess: {
    backgroundColor: colors.green,
  },
  cartButtonDisabled: {
    backgroundColor: colors.sand,
  },
  cartButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  cartButtonTextDisabled: {
    color: colors.darkTertiary,
  },
  cartButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(214, 38, 74, 0.06)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  brandText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: colors.coral,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: 2,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  stockText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: colors.green,
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  noImageText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#9E9E9E',
  },
});
