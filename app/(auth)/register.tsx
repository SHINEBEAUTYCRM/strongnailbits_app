import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { colors, fontSizes, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { OtpInput } from '@/components/auth/OtpInput';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

type Step = 'phone' | 'otp' | 'register' | 'apple_phone';

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

  const [appleUserId, setAppleUserId] = useState<string | null>(null);

  // ─── Apple Sign-In ───
  const handleAppleLogin = async () => {
    setIsLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Apple не повернув токен');
      }

      const { data: authData, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;

      const userId = authData?.user?.id;
      if (!userId) throw new Error('Помилка авторизації');

      const updates: Record<string, string> = {};
      if (credential.fullName?.givenName) updates.first_name = credential.fullName.givenName;
      if (credential.fullName?.familyName) updates.last_name = credential.fullName.familyName;
      if (credential.email) updates.email = credential.email;
      else if (authData.user?.email) updates.email = authData.user.email;

      if (Object.keys(updates).length > 0) {
        await supabase.from('profiles').update(updates).eq('id', userId);
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .single();

      if (currentProfile?.phone) {
        await initialize();
        router.replace('/(tabs)/account');
        return;
      }

      setAppleUserId(userId);
      setPhone('');
      setStep('apple_phone');
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      showToast(err.message || 'Помилка входу через Apple', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Apple: Phone Submit + Sync ───
  const handleApplePhoneSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      showToast(
        language === 'ru' ? 'Введите корректный номер' : 'Введіть коректний номер',
        'error',
      );
      return;
    }

    setIsLoading(true);
    try {
      let normDigits = digits;
      if (normDigits.startsWith('0')) normDigits = '38' + normDigits;
      if (normDigits.length === 9) normDigits = '380' + normDigits;
      const normalized = '+' + normDigits;
      const local = '0' + normDigits.slice(3);

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .or(`phone.eq.${normalized},phone.eq.${normDigits},phone.eq.${local}`)
        .neq('id', appleUserId!)
        .maybeSingle();

      if (existingProfile) {
        const syncFields = [
          'first_name', 'last_name', 'company', 'email',
          'is_b2b', 'loyalty_points', 'loyalty_tier', 'balance',
          'credit_limit', 'discount_percent', 'metadata',
        ] as const;

        const syncData: Record<string, any> = { phone: normalized };
        for (const field of syncFields) {
          const val = (existingProfile as any)[field];
          if (val != null) syncData[field] = val;
        }

        await supabase.from('profiles').update(syncData).eq('id', appleUserId!);

        const oldId = existingProfile.id;
        await Promise.allSettled([
          supabase.from('orders').update({ profile_id: appleUserId! }).eq('profile_id', oldId),
          supabase.from('bonuses').update({ profile_id: appleUserId! }).eq('profile_id', oldId),
          supabase.from('documents').update({ profile_id: appleUserId! }).eq('profile_id', oldId),
        ]);

        showToast(
          language === 'ru' ? 'Данные синхронизированы' : 'Дані синхронізовано',
          'success',
        );
      } else {
        await supabase.from('profiles').update({ phone: normalized }).eq('id', appleUserId!);
        showToast(
          language === 'ru' ? 'Добро пожаловать!' : 'Ласкаво просимо!',
          'success',
        );
      }

      await initialize();
      router.replace('/(tabs)/account');
    } catch (err: any) {
      showToast(err.message || 'Помилка', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── SMS OTP ───
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
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { phone: phone.replace(/\D/g, ''), code: otp },
      });
      if (error) throw error;

      if (data?.existingUser && data?.hasAuth) {
        Alert.alert(
          language === 'ru' ? 'Аккаунт найден' : 'Акаунт знайдено',
          language === 'ru'
            ? 'Этот номер уже зарегистрирован. Войти с паролем?'
            : 'Цей номер вже зареєстрований. Увійти з паролем?',
          [
            { text: language === 'ru' ? 'Отмена' : 'Скасувати', style: 'cancel' },
            { text: language === 'ru' ? 'Войти' : 'Увійти', onPress: () => router.replace('/(auth)/login') },
          ]
        );
        return;
      }

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

      // Scenario A: user already fully registered
      if (data?.exists) {
        Alert.alert(
          language === 'ru' ? 'Аккаунт найден' : 'Акаунт знайдено',
          language === 'ru'
            ? 'Этот номер уже зарегистрирован. Войти с паролем?'
            : 'Цей номер вже зареєстрований. Увійти з паролем?',
          [
            { text: language === 'ru' ? 'Отмена' : 'Скасувати', style: 'cancel' },
            { text: language === 'ru' ? 'Войти' : 'Увійти', onPress: () => router.replace('/(auth)/login') },
          ]
        );
        return;
      }

      // Scenario B (claimed) or C (new) — auto-login
      if (data?.loginEmail) {
        await supabase.auth.signInWithPassword({
          email: data.loginEmail,
          password: formData.password,
        });
        await initialize();

        if (data.claimed) {
          showToast(
            language === 'ru'
              ? 'Нашли ваш аккаунт! Бонусы и заказы сохранены'
              : 'Знайшли ваш акаунт! Бонуси та замовлення збережені',
            'success'
          );
        }

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
        <TouchableOpacity onPress={() => {
          if (step === 'apple_phone') {
            supabase.auth.signOut();
            setAppleUserId(null);
            setStep('phone');
          } else {
            router.back();
          }
        }}>
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

            {Platform.OS === 'ios' && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>
                    {language === 'ru' ? 'или' : 'або'}
                  </Text>
                  <View style={styles.dividerLine} />
                </View>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={999}
                  style={styles.appleButton}
                  onPress={handleAppleLogin}
                />
              </>
            )}
          </>
        )}

        {step === 'apple_phone' && (
          <View style={styles.applePhoneContainer}>
            <View style={styles.applePhoneIconWrap}>
              <Text style={{ fontSize: 36 }}>📱</Text>
            </View>

            <Text style={styles.appleTitle}>
              {language === 'ru' ? 'Укажите номер телефона' : 'Вкажіть номер телефону'}
            </Text>

            <Text style={styles.appleSubtitle}>
              {language === 'ru'
                ? 'Если вы наш клиент — данные подтянутся автоматически'
                : 'Якщо ви наш клієнт — дані підтягнуться автоматично'}
            </Text>

            <PhoneInput value={phone} onChangeText={setPhone} />

            <Button
              title={language === 'ru' ? 'Продолжить' : 'Продовжити'}
              onPress={handleApplePhoneSubmit}
              loading={isLoading}
              fullWidth
              disabled={phone.replace(/\D/g, '').length < 10}
            />
          </View>
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

        {step !== 'apple_phone' && (
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>
              {language === 'ru' ? 'Уже есть аккаунт? Войти' : 'Вже є акаунт? Увійти'}
            </Text>
          </TouchableOpacity>
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e5e5',
  },
  dividerText: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
  },
  appleButton: {
    width: '100%',
    height: 48,
  },
  applePhoneContainer: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xl,
  },
  applePhoneIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleTitle: {
    fontSize: fontSizes.xl,
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
    textAlign: 'center',
  },
  appleSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    textAlign: 'center',
  },
});
