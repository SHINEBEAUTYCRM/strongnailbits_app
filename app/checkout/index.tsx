import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Platform } from 'react-native';
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
import type { ShippingData } from '@/components/checkout/ShippingForm';

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

  const [shipping, setShipping] = useState<ShippingData>({
    method: 'np_warehouse',
    city: '',
    cityRef: '',
    deliveryCityRef: '',
    warehouse: '',
    warehouseRef: '',
    street: '',
    streetRef: '',
    house: '',
    address: '',
    country: '',
    intlCity: '',
    intlAddress: '',
    intlPostcode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [companyName, setCompanyName] = useState('');
  const [edrpou, setEdrpou] = useState('');
  const [notes, setNotes] = useState('');

  const isInternational = shipping.method === 'np_intl' || shipping.method === 'ukrposhta_intl';

  React.useEffect(() => {
    trackBeginCheckout(total);
  }, []);

  // При переключении на международную доставку — сбросить cod
  React.useEffect(() => {
    if (isInternational && paymentMethod === 'cod') {
      setPaymentMethod('invoice');
    }
  }, [isInternational]);

  function validate(): boolean {
    if (!contact.phone || !contact.firstName || !contact.lastName) {
      showToast(
        language === 'ru' ? 'Заполните имя, фамилию и телефон' : "Заповніть ім'я, прізвище та телефон",
        'error'
      );
      return false;
    }

    const m = shipping.method;

    if (m === 'np_warehouse' && (!shipping.city || !shipping.warehouse)) {
      showToast(
        language === 'ru' ? 'Выберите город и отделение' : 'Оберіть місто та відділення',
        'error'
      );
      return false;
    }
    if (m === 'np_address' && (!shipping.city || !shipping.street || !shipping.house)) {
      showToast(
        language === 'ru' ? 'Заполните адрес доставки' : 'Заповніть адресу доставки',
        'error'
      );
      return false;
    }
    if ((m === 'np_intl' || m === 'ukrposhta_intl') && (!shipping.country || !shipping.intlCity || !shipping.intlAddress)) {
      showToast(
        language === 'ru' ? 'Заполните международный адрес' : 'Заповніть міжнародну адресу',
        'error'
      );
      return false;
    }
    if (paymentMethod === 'invoice' && (!companyName || !edrpou)) {
      showToast(
        language === 'ru' ? 'Заполните данные компании' : 'Заповніть дані компанії',
        'error'
      );
      return false;
    }

    return true;
  }

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await supabase.functions.invoke('create-order', {
        body: {
          items: items.map((item) => ({
            product_id: item.product_id,
            name: item.name,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          contact: {
            phone: contact.phone.replace(/[\s\-()]/g, ''),
            firstName: contact.firstName.trim(),
            lastName: contact.lastName.trim(),
            email: contact.email.trim(),
          },
          shipping: {
            method: shipping.method,
            city: shipping.city,
            cityRef: shipping.cityRef,
            warehouse: shipping.warehouse,
            warehouseRef: shipping.warehouseRef,
            street: shipping.street,
            house: shipping.house,
            address: shipping.address,
            country: shipping.country,
            intlCity: shipping.intlCity,
            intlAddress: shipping.intlAddress,
            intlPostcode: shipping.intlPostcode,
          },
          payment: {
            method: paymentMethod,
            companyName: paymentMethod === 'invoice' ? companyName : undefined,
            edrpou: paymentMethod === 'invoice' ? edrpou : undefined,
          },
          notes,
          platform: Platform.OS,
        },
      });

      console.log('create-order response:', JSON.stringify(response));

      if (response.error) {
        const realError = response.data?.error || response.error?.message || 'Невідома помилка';
        throw new Error(realError);
      }

      if (!response.data) {
        throw new Error('Порожня відповідь від сервера');
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const data = response.data;

      trackPurchase(data.orderNumber, total);
      clearCart();
      router.replace(`/checkout/success?orderNumber=${data.orderNumber}`);
    } catch (err: any) {
      console.error('Order failed:', err);
      const msg = err?.message || err?.error || JSON.stringify(err);
      showToast(`Помилка: ${msg}`, 'error');
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
        keyboardShouldPersistTaps="handled"
      >
        <ContactForm data={contact} onChange={setContact} />

        <ShippingForm data={shipping} onChange={setShipping} />

        <PaymentForm
          method={paymentMethod}
          onChange={setPaymentMethod}
          isInternational={isInternational}
          companyName={companyName}
          edrpou={edrpou}
          onCompanyChange={({ companyName: cn, edrpou: ed }) => {
            setCompanyName(cn);
            setEdrpou(ed);
          }}
        />

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
