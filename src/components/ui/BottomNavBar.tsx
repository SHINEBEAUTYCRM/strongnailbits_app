import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Home, LayoutGrid, ShoppingCart, Heart, User } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/theme';
import { useCartStore } from '@/stores/cart';
import { useWishlistStore } from '@/stores/wishlist';
import { useEffect, useRef } from 'react';

function Badge({ count, color }: { count: number; color: string }) {
  const scale = useSharedValue(1);
  const prev = useRef(count);

  useEffect(() => {
    if (count !== prev.current && count > 0) {
      scale.value = withSequence(
        withSpring(1.4, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
    }
    prev.current = count;
  }, [count]);

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (count <= 0) return null;

  return (
    <Animated.View style={[styles.badge, { backgroundColor: color }, anim]}>
      <Text style={styles.badgeText}>{count}</Text>
    </Animated.View>
  );
}

const TABS = [
  { key: 'home', route: '/(tabs)', match: ['/'], icon: Home, label: 'Головна' },
  { key: 'catalog', route: '/(tabs)/catalog', match: ['/catalog'], icon: LayoutGrid, label: 'Каталог' },
  { key: 'cart', route: '/(tabs)/cart', match: ['/cart'], icon: ShoppingCart, label: 'Кошик' },
  { key: 'wishlist', route: '/(tabs)/wishlist', match: ['/wishlist'], icon: Heart, label: 'Обране' },
  { key: 'account', route: '/(tabs)/account', match: ['/account'], icon: User, label: 'Профіль' },
] as const;

export function BottomNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const cartCount = useCartStore((s) => s.getCount());
  const wishlistCount = useWishlistStore((s) => s.getCount());

  const isActive = (match: readonly string[]) =>
    match.some((m) => pathname === m || pathname.startsWith(m + '/'));

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      {TABS.map((tab) => {
        const active = isActive(tab.match);
        const tint = active ? colors.coral : colors.darkTertiary;
        const Icon = tab.icon;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => router.navigate(tab.route as any)}
            activeOpacity={0.7}
          >
            <View>
              <Icon size={24} color={tint} />
              {tab.key === 'cart' && <Badge count={cartCount} color={colors.coral} />}
              {tab.key === 'wishlist' && <Badge count={wishlistCount} color={colors.coral} />}
            </View>
            <Text style={[styles.label, { color: tint }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    lineHeight: 14,
  },
});
