import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors, fontSizes, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { OtpInput } from '@/components/auth/OtpInput';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

type Step = 'phone' | 'otp' | 'otp_password' | 'password';

export default function LoginScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const initialize = useAuthStore((s) => s.initialize);
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendOtp = async () => {
    if (phone.replace(/\D/g, '').length < 12) {
      showToast(language === 'ru' ? 'Введите корректный номер' : 'Введіть коректний номер', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-otp', {
        body: { phone: phone.replace(/\D/g, '') },
      });
      if (error) throw error;
      setStep('otp');
      startCountdown();
      showToast(language === 'ru' ? 'Код отправлен' : 'Код відправлено', 'success');
    } catch {
      showToast(language === 'ru' ? 'Ошибка отправки кода' : 'Помилка відправки коду', 'error');
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

      if (data?.existingUser && data?.loginEmail) {
        // OTP verified — now ask for password to complete sign-in
        setLoginEmail(data.loginEmail);
        setStep('otp_password');
        showToast(
          language === 'ru' ? 'Код подтверждён. Введите пароль.' : 'Код підтверджено. Введіть пароль.',
          'success'
        );
      } else {
        showToast(
          language === 'ru' ? 'Пользователь не найден. Зарегистрируйтесь.' : 'Користувача не знайдено. Зареєструйтесь.',
          'info'
        );
        router.replace('/(auth)/register');
      }
    } catch {
      showToast(language === 'ru' ? 'Неверный код' : 'Невірний код', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpPasswordLogin = async () => {
    if (!password || password.length < 1) {
      showToast(language === 'ru' ? 'Введите пароль' : 'Введіть пароль', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });
      if (error) throw error;

      await initialize();
      router.replace('/(tabs)/account');
    } catch {
      showToast(language === 'ru' ? 'Неверный пароль' : 'Невірний пароль', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    setIsLoading(true);
    try {
      const { data: authData } = await supabase.functions.invoke('phone-auth', {
        body: { phone: phone.replace(/\D/g, ''), action: 'get-login-email' },
      });

      if (!authData?.loginEmail) {
        showToast(language === 'ru' ? 'Пользователь не найден' : 'Користувача не знайдено', 'error');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: authData.loginEmail,
        password,
      });
      if (error) throw error;

      await initialize();
      router.replace('/(tabs)/account');
    } catch {
      showToast(language === 'ru' ? 'Неверный пароль' : 'Невірний пароль', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
          {language === 'ru' ? 'Вход' : 'Вхід'}
        </Text>

        {step === 'phone' && (
          <>
            <PhoneInput value={phone} onChangeText={setPhone} />
            {usePassword ? (
              <>
                <Input
                  label={language === 'ru' ? 'Пароль' : 'Пароль'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <Button
                  title={language === 'ru' ? 'Войти' : 'Увійти'}
                  onPress={handlePasswordLogin}
                  loading={isLoading}
                  fullWidth
                />
                <TouchableOpacity onPress={() => setUsePassword(false)}>
                  <Text style={styles.link}>
                    {language === 'ru' ? 'Войти по SMS' : 'Увійти по SMS'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Button
                  title={language === 'ru' ? 'Получить код' : 'Отримати код'}
                  onPress={handleSendOtp}
                  loading={isLoading}
                  fullWidth
                />
                <TouchableOpacity onPress={() => setUsePassword(true)}>
                  <Text style={styles.link}>
                    {language === 'ru' ? 'Войти с паролем' : 'Увійти з паролем'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
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
            {countdown > 0 ? (
              <Text style={styles.countdown}>
                {language === 'ru' ? 'Повторно через' : 'Повторно через'} {countdown}с
              </Text>
            ) : (
              <TouchableOpacity onPress={handleSendOtp}>
                <Text style={styles.link}>
                  {language === 'ru' ? 'Отправить повторно' : 'Відправити повторно'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {step === 'otp_password' && (
          <>
            <Text style={styles.subtitle}>
              {language === 'ru' ? 'Введите ваш пароль' : 'Введіть ваш пароль'}
            </Text>
            <Input
              label={language === 'ru' ? 'Пароль' : 'Пароль'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Button
              title={language === 'ru' ? 'Войти' : 'Увійти'}
              onPress={handleOtpPasswordLogin}
              loading={isLoading}
              fullWidth
            />
          </>
        )}

        {/* Register link */}
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.registerLink}>
            {language === 'ru' ? 'Нет аккаунта? Зарегистрироваться' : 'Немає акаунту? Зареєструватися'}
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
    paddingTop: spacing['3xl'],
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
    marginBottom: spacing.md,
  },
  link: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.coral,
    textAlign: 'center',
  },
  countdown: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
    textAlign: 'center',
  },
  registerLink: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.violet,
    textAlign: 'center',
    marginTop: spacing['2xl'],
  },
});
