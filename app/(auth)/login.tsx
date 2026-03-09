import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { colors, fontSizes, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

type Step = 'phone' | 'apple_phone';

export default function LoginScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const initialize = useAuthStore((s) => s.initialize);
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appleUserId, setAppleUserId] = useState<string | null>(null);

  // ─── Password Login ───
  const handlePasswordLogin = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      showToast(
        language === 'ru' ? 'Введите корректный номер' : 'Введіть коректний номер',
        'error',
      );
      return;
    }
    if (!password) {
      showToast(language === 'ru' ? 'Введите пароль' : 'Введіть пароль', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const { data: authData } = await supabase.functions.invoke('phone-auth', {
        body: { phone: phone.replace(/\D/g, ''), action: 'get-login-email' },
      });
      if (!authData?.loginEmail) {
        showToast(
          language === 'ru' ? 'Пользователь не найден' : 'Користувача не знайдено',
          'error',
        );
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
        showToast(language === 'ru' ? 'Добро пожаловать!' : 'Ласкаво просимо!', 'success');
      }

      await initialize();
      router.replace('/(tabs)/account');
    } catch (err: any) {
      showToast(err.message || 'Помилка', 'error');
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
          {language === 'ru' ? 'Вход' : 'Вхід'}
        </Text>

        {/* ── Phone + Password Step ── */}
        {step === 'phone' && (
          <>
            <PhoneInput value={phone} onChangeText={setPhone} />

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

            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>
                {language === 'ru' ? 'Нет аккаунта? Зарегистрироваться' : 'Немає акаунту? Зареєструватися'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Apple Phone Step ── */}
        {step === 'apple_phone' && (
          <View style={styles.applePhoneContainer}>
            <View style={styles.applePhoneIcon}>
              <Text style={{ fontSize: 36 }}>📱</Text>
            </View>

            <Text style={styles.stepTitle}>
              {language === 'ru' ? 'Укажите номер телефона' : 'Вкажіть номер телефону'}
            </Text>

            <Text style={styles.stepSubtitle}>
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
  registerLink: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.violet,
    textAlign: 'center',
    marginTop: spacing['2xl'],
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
  stepTitle: {
    fontSize: fontSizes.xl,
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    textAlign: 'center',
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
