import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { colors, fontSizes, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/stores/cart';
import { supabase } from '@/lib/supabase/client';
import { ContactForm } from '@/components/checkout/ContactForm';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { trackBeginCheckout, trackPurchase } from '@/lib/analytics/tracker';
import type { ShippingMethod, PaymentMethod } from '@/types/order';

export default function CheckoutScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { profile } = useAuth();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.getTotal());
  const clearCart = useCartStore((s) => s.clearCart);
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [contact, setContact] = useState({
    phone: profile?.phone ?? '',
    firstName: profile?.first_name ?? '',
    lastName: profile?.last_name ?? '',
    email: profile?.email ?? '',
  });

  const [shipping, setShipping] = useState({
    method: 'nova_poshta' as ShippingMethod,
    city: '',
    warehouse: '',
    address: '',
    country: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    trackBeginCheckout(total);
  }, []);

  const handleSubmit = async () => {
    if (!contact.phone || !contact.firstName) {
      showToast(
        language === 'ru' ? 'Заполните обязательные поля' : "Заповніть обов'язкові поля",
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          items: items.map((item) => ({
            product_id: item.product_id,
            name: item.name,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          contact,
          shipping,
          payment: { method: paymentMethod },
          notes,
        },
      });

      if (error) throw error;

      trackPurchase(data.orderNumber, total);
      clearCart();
      router.replace(`/checkout/success?orderNumber=${data.orderNumber}`);
    } catch (error) {
      console.error('Order failed:', error);
      showToast(
        language === 'ru' ? 'Ошибка оформления заказа' : 'Помилка оформлення замовлення',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {language === 'ru' ? 'Оформление заказа' : 'Оформлення замовлення'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ContactForm data={contact} onChange={setContact} />
        <ShippingForm data={shipping} onChange={setShipping} />
        <PaymentForm method={paymentMethod} onChange={setPaymentMethod} />

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>
            {language === 'ru' ? 'Комментарий к заказу' : 'Коментар до замовлення'}
          </Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholder={language === 'ru' ? 'Ваш комментарий...' : 'Ваш коментар...'}
            placeholderTextColor={colors.darkTertiary}
          />
        </View>

        <OrderSummary />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={language === 'ru' ? 'Подтвердить заказ' : 'Підтвердити замовлення'}
          onPress={handleSubmit}
          loading={submitting}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: fontSizes.lg,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
  },
  content: {
    padding: spacing.lg,
    gap: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  notesSection: {
    gap: spacing.sm,
  },
  notesLabel: {
    fontSize: fontSizes.lg,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
  },
  notesInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.dark,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
