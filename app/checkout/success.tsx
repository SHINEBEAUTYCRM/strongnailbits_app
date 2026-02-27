import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { colors, fontSizes, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export default function CheckoutSuccessScreen() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <CheckCircle size={80} color={colors.green} />
        <Text style={styles.title}>
          {language === 'ru' ? 'Спасибо за заказ!' : 'Дякуємо за замовлення!'}
        </Text>
        {orderNumber && (
          <Text style={styles.orderNumber}>
            {language === 'ru' ? 'Номер заказа' : 'Номер замовлення'}: #{orderNumber}
          </Text>
        )}
        <Text style={styles.subtitle}>
          {language === 'ru'
            ? 'Мы свяжемся с вами в ближайшее время'
            : "Ми зв'яжемося з вами найближчим часом"}
        </Text>

        <View style={styles.actions}>
          <Button
            title={language === 'ru' ? 'На главную' : 'На головну'}
            onPress={() => router.replace('/(tabs)/')}
            fullWidth
          />
          {isAuthenticated && (
            <Button
              title={language === 'ru' ? 'Мои заказы' : 'Мої замовлення'}
              onPress={() => router.replace('/(tabs)/account/orders')}
              variant="outline"
              fullWidth
            />
          )}
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.lg,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  orderNumber: {
    fontSize: fontSizes.lg,
    fontFamily: 'JetBrainsMono-Medium',
    color: colors.violet,
  },
  subtitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing['2xl'],
  },
});
