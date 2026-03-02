import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { colors, fontSizes, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { OtpInput } from '@/components/auth/OtpInput';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const API_BASE = 'https://shineshopb2b.com';

type Step = 'phone' | 'telegram_waiting' | 'otp' | 'otp_password' | 'password' | 'apple_phone';

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

  // Apple phone step
  const [appleUserId, setAppleUserId] = useState<string | null>(null);

  // Telegram auth state
  const [tgToken, setTgToken] = useState<string | null>(null);
  const [tgStatus, setTgStatus] = useState<'sent' | 'need_link' | 'register' | null>(null);
  const [tgBotUrl, setTgBotUrl] = useState<string | null>(null);
  const [tgCountdown, setTgCountdown] = useState(300);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (step !== 'telegram_waiting') return;
    if (tgCountdown <= 0) {
      stopPolling();
      showToast(language === 'ru' ? 'Время вышло' : 'Час вийшов', 'error');
      setStep('phone');
      return;
    }
    const timer = setInterval(() => setTgCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [step, tgCountdown]);

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

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
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .neq('id', appleUserId!)
        .maybeSingle();

      if (existingProfile) {
        const syncFields = [
          'first_name', 'last_name', 'company', 'email',
          'is_b2b', 'loyalty_points', 'loyalty_tier', 'balance',
          'credit_limit', 'discount_percent', 'metadata',
        ] as const;

        const syncData: Record<string, any> = { phone };
        for (const field of syncFields) {
          const val = (existingProfile as any)[field];
          if (val != null) syncData[field] = val;
        }

        await supabase.from('profiles').update(syncData).eq('id', appleUserId!);

        // Migrate orders, bonuses, documents to Apple account
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
        await supabase.from('profiles').update({ phone }).eq('id', appleUserId!);
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

  // ─── Telegram Login ───
  const handleTelegramLogin = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      showToast(language === 'ru' ? 'Введите корректный номер' : 'Введіть коректний номер', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/telegram-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Помилка');

      setTgToken(data.token);
      setTgStatus(data.status);
      if (data.botUrl) setTgBotUrl(data.botUrl);
      setTgCountdown(300);
      setStep('telegram_waiting');

      startPolling(data.token);

      const url = data.botUrl || 'https://t.me/shineshop_b2b_bot';
      setTimeout(() => Linking.openURL(url), 500);

    } catch (err: any) {
      showToast(err.message || 'Помилка', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  function startPolling(token: string) {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/telegram-check?token=${token}`);
        const data = await res.json();
        if (data.status === 'confirmed') {
          stopPolling();
          await completeTelegramLogin(token);
        } else if (data.status === 'expired' || data.status === 'denied') {
          stopPolling();
          showToast(language === 'ru' ? 'Вход отклонён' : 'Вхід відхилено', 'error');
          setStep('phone');
        }
      } catch {}
    }, 3000);
  }

  async function completeTelegramLogin(token: string) {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/telegram-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Помилка');

      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      });
      if (otpError) throw new Error('Помилка автоматичного входу');

      await initialize();
      if (data.isNewUser) {
        router.replace('/(tabs)/account');
        showToast(language === 'ru' ? 'Заполните профиль' : 'Заповніть профіль', 'info');
      } else {
        router.replace('/(tabs)/account');
      }
    } catch (err: any) {
      showToast(err.message || 'Помилка входу', 'error');
      setStep('phone');
    } finally {
      setIsLoading(false);
    }
  }

  // ─── SMS OTP ───
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

  const tgMinutes = Math.floor(tgCountdown / 60);
  const tgSeconds = tgCountdown % 60;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (step === 'telegram_waiting') {
            stopPolling();
            setStep('phone');
          } else if (step === 'apple_phone') {
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
          {language === 'ru' ? 'Вход' : 'Вхід'}
        </Text>

        {/* ── Phone Step ── */}
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
                    {language === 'ru' ? 'Другие способы входа' : 'Інші способи входу'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Button
                  title={language === 'ru' ? 'Войти через Telegram' : 'Увійти через Telegram'}
                  onPress={handleTelegramLogin}
                  loading={isLoading}
                  fullWidth
                />

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleSendOtp}
                  disabled={isLoading || phone.replace(/\D/g, '').length < 10}
                >
                  <Text style={[
                    styles.secondaryButtonText,
                    (isLoading || phone.replace(/\D/g, '').length < 10) && { opacity: 0.5 }
                  ]}>
                    {language === 'ru' ? 'Получить SMS-код' : 'Отримати SMS-код'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setUsePassword(true)}>
                  <Text style={styles.link}>
                    {language === 'ru' ? 'Войти с паролем' : 'Увійти з паролем'}
                  </Text>
                </TouchableOpacity>

                {/* Apple Sign-In (iOS only) */}
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
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                      cornerRadius={999}
                      style={styles.appleButton}
                      onPress={handleAppleLogin}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ── Telegram Waiting Step ── */}
        {step === 'telegram_waiting' && (
          <View style={styles.telegramWaiting}>
            <View style={styles.tgIconContainer}>
              <ActivityIndicator size="small" color="#26A5E4" style={styles.tgSpinner} />
              <Text style={styles.tgIcon}>✈️</Text>
            </View>

            <Text style={styles.tgTitle}>
              {tgStatus === 'register'
                ? (language === 'ru' ? 'Регистрация через Telegram' : 'Реєстрація через Telegram')
                : tgStatus === 'need_link'
                  ? (language === 'ru' ? 'Подключите Telegram' : 'Підключіть Telegram')
                  : (language === 'ru' ? 'Проверьте Telegram' : 'Перевірте Telegram')
              }
            </Text>

            <Text style={styles.tgSubtitle}>
              {tgStatus === 'register'
                ? (language === 'ru' ? 'Откройте бот и отправьте номер' : 'Відкрийте бот та надішліть номер')
                : tgStatus === 'need_link'
                  ? (language === 'ru' ? 'Откройте бот и подтвердите' : 'Відкрийте бот та підтвердіть')
                  : (language === 'ru' ? 'Нажмите «Подтвердить» в боте' : 'Натисніть «Підтвердити» в боті')
              }
            </Text>

            <View style={styles.tgTimer}>
              <Text style={[styles.tgTimerText, tgCountdown < 60 && { color: '#ef4444' }]}>
                {tgMinutes}:{tgSeconds.toString().padStart(2, '0')}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.tgOpenButton}
              onPress={() => {
                const url = tgBotUrl || 'https://t.me/shineshop_b2b_bot';
                Linking.openURL(url);
              }}
            >
              <Text style={styles.tgOpenButtonText}>
                {language === 'ru' ? 'Открыть Telegram' : 'Відкрити Telegram'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { stopPolling(); setStep('phone'); }}>
              <Text style={styles.link}>
                {language === 'ru' ? 'Ввести другой номер' : 'Ввести інший номер'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Apple Phone Step ── */}
        {step === 'apple_phone' && (
          <View style={styles.applePhoneContainer}>
            <View style={styles.applePhoneIcon}>
              <Text style={{ fontSize: 36 }}>📱</Text>
            </View>

            <Text style={styles.tgTitle}>
              {language === 'ru' ? 'Укажите номер телефона' : 'Вкажіть номер телефону'}
            </Text>

            <Text style={styles.tgSubtitle}>
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

        {/* ── OTP Step ── */}
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

        {/* ── OTP Password Step ── */}
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
        {step !== 'telegram_waiting' && step !== 'apple_phone' && (
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>
              {language === 'ru' ? 'Нет аккаунта? Зарегистрироваться' : 'Немає акаунту? Зареєструватися'}
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
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.darkSecondary,
  },
  telegramWaiting: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xl,
  },
  tgIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(38, 165, 228, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tgSpinner: {
    position: 'absolute',
  },
  tgIcon: {
    fontSize: 32,
  },
  tgTitle: {
    fontSize: fontSizes.xl,
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
    textAlign: 'center',
  },
  tgSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    textAlign: 'center',
  },
  tgTimer: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fafafa',
  },
  tgTimerText: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.darkSecondary,
  },
  tgOpenButton: {
    backgroundColor: '#26A5E4',
    borderRadius: 999,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tgOpenButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  applePhoneContainer: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xl,
  },
  applePhoneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
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
});
