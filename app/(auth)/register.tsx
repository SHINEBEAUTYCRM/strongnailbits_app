import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { colors, fontSizes, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { OtpInput } from '@/components/auth/OtpInput';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

type Step = 'phone' | 'otp' | 'register';

export default function RegisterScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const initialize = useAuthStore((s) => s.initialize);
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    password: '',
  });

  const handleSendOtp = async () => {
    if (phone.replace(/\D/g, '').length < 12) {
      showToast(language === 'ru' ? 'Введите корректный номер' : 'Введіть коректний номер', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await supabase.functions.invoke('send-otp', {
        body: { phone: phone.replace(/\D/g, '') },
      });
      setStep('otp');
      showToast(language === 'ru' ? 'Код отправлен' : 'Код відправлено', 'success');
    } catch {
      showToast(language === 'ru' ? 'Ошибка отправки' : 'Помилка відправки', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('verify-otp', {
        body: { phone: phone.replace(/\D/g, ''), code: otp },
      });
      if (error) throw error;
      setStep('register');
    } catch {
      showToast(language === 'ru' ? 'Неверный код' : 'Невірний код', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.firstName || !formData.lastName || formData.password.length < 6) {
      showToast(
        language === 'ru' ? 'Заполните все обязательные поля' : "Заповніть усі обов'язкові поля",
        'error'
      );
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('phone-auth', {
        body: {
          phone: phone.replace(/\D/g, ''),
          action: 'register',
          firstName: formData.firstName,
          lastName: formData.lastName,
          company: formData.company,
          password: formData.password,
        },
      });
      if (error) throw error;

      if (data?.loginEmail) {
        await supabase.auth.signInWithPassword({
          email: data.loginEmail,
          password: formData.password,
        });
        await initialize();
        router.replace('/(tabs)/account');
      }
    } catch {
      showToast(language === 'ru' ? 'Ошибка регистрации' : 'Помилка реєстрації', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.dark} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {language === 'ru' ? 'Регистрация' : 'Реєстрація'}
        </Text>

        {step === 'phone' && (
          <>
            <PhoneInput value={phone} onChangeText={setPhone} />
            <Button
              title={language === 'ru' ? 'Получить код' : 'Отримати код'}
              onPress={handleSendOtp}
              loading={isLoading}
              fullWidth
            />
          </>
        )}

        {step === 'otp' && (
          <>
            <Text style={styles.subtitle}>
              {language === 'ru' ? 'Введите код из SMS' : 'Введіть код з SMS'}
            </Text>
            <OtpInput value={otp} onChange={setOtp} />
            <Button
              title={language === 'ru' ? 'Подтвердить' : 'Підтвердити'}
              onPress={handleVerifyOtp}
              loading={isLoading}
              fullWidth
              disabled={otp.length < 4}
            />
          </>
        )}

        {step === 'register' && (
          <>
            <RegisterForm data={formData} onChange={setFormData} />
            <Button
              title={language === 'ru' ? 'Зарегистрироваться' : 'Зареєструватися'}
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
            />
          </>
        )}

        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginLink}>
            {language === 'ru' ? 'Уже есть аккаунт? Войти' : 'Вже є акаунт? Увійти'}
          </Text>
        </TouchableOpacity>
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
    paddingVertical: spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    gap: spacing.lg,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    textAlign: 'center',
  },
  loginLink: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.violet,
    textAlign: 'center',
    marginTop: spacing['2xl'],
  },
});
