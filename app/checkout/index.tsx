import React, { useState, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
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
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { trackBeginCheckout, trackPurchase } from '@/lib/analytics/tracker';
import type { ShippingData } from '@/components/checkout/ShippingForm';

const TOTAL_STEPS = 3;

export default function CheckoutScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { profile } = useAuth();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.getTotal());
  const clearCart = useCartStore((s) => s.clearCart);
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

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

  React.useEffect(() => {
    if (isInternational && paymentMethod === 'cod') {
      setPaymentMethod('invoice');
    }
  }, [isInternational]);

  function validateStep(s: number): boolean {
    if (s === 0) {
      if (!contact.phone || !contact.firstName || !contact.lastName) {
        showToast(
          language === 'ru' ? 'Заполните имя, фамилию и телефон' : "Заповніть ім'я, прізвище та телефон",
          'error'
        );
        return false;
      }
    }
    if (s === 1) {
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
    }
    if (s === 2) {
      if (paymentMethod === 'invoice' && (!companyName || !edrpou)) {
        showToast(
          language === 'ru' ? 'Заполните данные компании' : 'Заповніть дані компанії',
          'error'
        );
        return false;
      }
    }
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }

  function goBack() {
    if (step > 0) {
      setStep(step - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      router.back();
    }
  }

  const stepTitles = language === 'ru'
    ? ['Контактные данные', 'Доставка', 'Оплата']
    : ['Контактні дані', 'Доставка', 'Оплата'];

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setSubmitting(true);
    try {
      await supabase.auth.refreshSession();

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

      if (profile?.id) {
        supabase.from('carts').delete().eq('profile_id', profile.id).then(() => {});
      }

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <ArrowLeft size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>{stepTitles[step]}</Text>
        <Text style={styles.stepCounter}>{step + 1}/{TOTAL_STEPS}</Text>
      </View>

      {/* Progress */}
      <CheckoutProgress currentStep={step} totalSteps={TOTAL_STEPS} />

      {/* Step Content */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <ContactForm data={contact} onChange={setContact} />
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <ShippingForm data={shipping} onChange={setShipping} />
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
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
          </Animated.View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {step < TOTAL_STEPS - 1 ? (
          <Button
            title={language === 'ru' ? 'Продолжить' : 'Продовжити'}
            onPress={goNext}
            fullWidth
            size="lg"
          />
        ) : (
          <Button
            title={language === 'ru' ? 'Подтвердить заказ' : 'Підтвердити замовлення'}
            onPress={handleSubmit}
            loading={submitting}
            fullWidth
            size="lg"
          />
        )}
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
  stepCounter: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.darkTertiary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  notesSection: {
    gap: spacing.sm,
    marginTop: spacing['2xl'],
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
