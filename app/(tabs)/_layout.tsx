import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Tabs } from 'expo-router';
import { Home, LayoutGrid, ShoppingCart, Heart, User } from 'lucide-react-native';
import { colors } from '@/theme';
import { useCartStore } from '@/stores/cart';
import { useWishlistStore } from '@/stores/wishlist';

/* ── Animated badge that bounces on count change ── */
function AnimatedBadge({ count, color }: { count: number; color: string }) {
  const scale = useSharedValue(1);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current && count > 0) {
      scale.value = withSequence(
        withSpring(1.4, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
    }
    prevCount.current = count;
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count <= 0) return null;

  return (
    <Animated.View style={[badgeStyles.badge, { backgroundColor: color }, animatedStyle]}>
      <Text style={badgeStyles.text}>{count}</Text>
    </Animated.View>
  );
}

const badgeStyles = StyleSheet.create({
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
  text: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    lineHeight: 14,
  },
});

export default function TabsLayout() {
  const cartCount = useCartStore((s) => s.getCount());
  const wishlistCount = useWishlistStore((s) => s.getCount());

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.coral,
        tabBarInactiveTintColor: colors.darkTertiary,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 85,
          paddingBottom: 25,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Inter-Medium',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Головна',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Каталог',
          tabBarIcon: ({ color }) => <LayoutGrid size={24} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const catalogRoute = state.routes.find((r: any) => r.name === 'catalog');
            if (catalogRoute && catalogRoute.state && catalogRoute.state.index > 0) {
              e.preventDefault();
              navigation.navigate('catalog', { screen: 'index' });
            }
          },
        })}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Кошик',
          tabBarIcon: ({ color }) => (
            <View>
              <ShoppingCart size={24} color={color} />
              <AnimatedBadge count={cartCount} color={colors.coral} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Обране',
          tabBarIcon: ({ color }) => (
            <View>
              <Heart size={24} color={color} />
              <AnimatedBadge count={wishlistCount} color={colors.coral} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Профіль',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
