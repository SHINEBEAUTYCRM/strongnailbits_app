import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { colors, fontSizes, spacing } from '@/theme';
import { Text } from 'react-native';
import { useLanguage } from '@/hooks/useLanguage';
import { useCartStore } from '@/stores/cart';
import { CartItemComponent } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CartScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const items = useCartStore((s) => s.items);

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {language === 'ru' ? 'Корзина' : 'Кошик'}
          </Text>
        </View>
        <EmptyState
          icon={<ShoppingBag size={64} color={colors.darkTertiary} />}
          title={language === 'ru' ? 'Ваша корзина пуста' : 'Ваш кошик порожній'}
          actionTitle={language === 'ru' ? 'Перейти в каталог' : 'Перейти до каталогу'}
          onAction={() => router.push('/(tabs)/catalog')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === 'ru' ? 'Корзина' : 'Кошик'}
        </Text>
      </View>

      <FlatList
        data={items}
        renderItem={({ item }) => <CartItemComponent item={item} />}
        keyExtractor={(item) => item.product_id}
        ListFooterComponent={<CartSummary />}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Button
          title={language === 'ru' ? 'Оформить заказ' : 'Оформити замовлення'}
          onPress={() => router.push('/checkout')}
          fullWidth
          size="lg"
        />
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
