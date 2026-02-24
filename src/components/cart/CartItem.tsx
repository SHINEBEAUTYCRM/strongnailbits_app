import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { formatPrice } from '@/utils/format';
import { useCartStore } from '@/stores/cart';
import type { CartItem as CartItemType } from '@/types/cart';

interface CartItemProps {
  item: CartItemType;
}

export const CartItemComponent = memo(function CartItemComponent({
  item,
}: CartItemProps) {
  const router = useRouter();
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push(`/product/${item.slug}`)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.image || undefined }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          {item.old_price && item.old_price > item.price && (
            <Text style={styles.oldPrice}>{formatPrice(item.old_price)}</Text>
          )}
        </View>

        <View style={styles.actions}>
          <QuantitySelector
            value={item.quantity}
            max={item.max_quantity}
            onChange={(qty) => updateQuantity(item.product_id, qty)}
            size="sm"
          />
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => removeItem(item.product_id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={18} color={colors.red} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.sand,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  price: {
    fontSize: fontSizes.md,
    fontFamily: 'JetBrainsMono-Bold',
    color: colors.dark,
  },
  oldPrice: {
    fontSize: fontSizes.sm,
    fontFamily: 'JetBrainsMono-Regular',
    color: colors.darkTertiary,
    textDecorationLine: 'line-through',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  deleteButton: {
    padding: spacing.sm,
  },
});
