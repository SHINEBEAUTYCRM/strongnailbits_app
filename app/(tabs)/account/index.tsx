import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  FileText,
  Gift,
  File,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';
import { colors, fontSizes, borderRadius, spacing, shadows } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { supabase } from '@/lib/supabase/client';
import { ProfileForm } from '@/components/account/ProfileForm';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';

export default function AccountScreen() {
  const router = useRouter();
  const { user, profile, isLoading, isAuthenticated, isB2B } = useAuth();
  const { language } = useLanguage();
  const signOut = useAuthStore((s) => s.signOut);
  const pushEnabled = useSettingsStore((s) => s.pushEnabled);
  const setPushEnabled = useSettingsStore((s) => s.setPushEnabled);
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState({
    firstName: profile?.first_name ?? '',
    lastName: profile?.last_name ?? '',
    phone: profile?.phone ?? '',
    company: profile?.company ?? '',
  });
  const [saving, setSaving] = useState(false);

  if (isLoading) return <Loading fullScreen />;

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>
            {language === 'ru' ? 'Войдите в аккаунт' : 'Увійдіть в акаунт'}
          </Text>
          <Text style={styles.authSubtitle}>
            {language === 'ru'
              ? 'Для просмотра заказов и управления профилем'
              : 'Для перегляду замовлень та керування профілем'}
          </Text>
          <Button
            title={language === 'ru' ? 'Войти' : 'Увійти'}
            onPress={() => router.push('/(auth)/login')}
            fullWidth
          />
          <Button
            title={language === 'ru' ? 'Зарегистрироваться' : 'Зареєструватися'}
            onPress={() => router.push('/(auth)/register')}
            variant="outline"
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          company: profileData.company,
        })
        .eq('id', user.id);
      showToast(language === 'ru' ? 'Профиль сохранён' : 'Профіль збережено', 'success');
    } catch {
      showToast(language === 'ru' ? 'Ошибка сохранения' : 'Помилка збереження', 'error');
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    {
      icon: <FileText size={22} color={colors.violet} />,
      title: language === 'ru' ? 'Мои заказы' : 'Мої замовлення',
      route: '/(tabs)/account/orders',
    },
    {
      icon: <Gift size={22} color={colors.coral} />,
      title: language === 'ru' ? 'Бонусы' : 'Бонуси',
      route: '/(tabs)/account/bonuses',
    },
    {
      icon: <File size={22} color={colors.amber} />,
      title: language === 'ru' ? 'Документы' : 'Документи',
      route: '/(tabs)/account/documents',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <Text style={styles.name}>
          {profile?.first_name} {profile?.last_name}
        </Text>

        {/* B2B Info */}
        {isB2B && (
          <View style={[styles.b2bCard, shadows.sm]}>
            <View style={styles.b2bRow}>
              <Text style={styles.b2bLabel}>Бонуси</Text>
              <Text style={styles.b2bValue}>
                {profile?.loyalty_points ?? 0} балів ({profile?.loyalty_tier})
              </Text>
            </View>
            {profile?.discount_percent ? (
              <View style={styles.b2bRow}>
                <Text style={styles.b2bLabel}>Знижка</Text>
                <Text style={styles.b2bValue}>{profile.discount_percent}%</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Quick Links */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as never)}
            >
              {item.icon}
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <ChevronRight size={20} color={colors.darkTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Profile Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'ru' ? 'Профиль' : 'Профіль'}
          </Text>
          <ProfileForm data={profileData} onChange={setProfileData} />
          <Button
            title={language === 'ru' ? 'Сохранить' : 'Зберегти'}
            onPress={handleSaveProfile}
            loading={saving}
            fullWidth
            variant="secondary"
          />
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'ru' ? 'Настройки' : 'Налаштування'}
          </Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              {language === 'ru' ? 'Язык' : 'Мова'}
            </Text>
            <LanguageSwitcher />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              Push-{language === 'ru' ? 'уведомления' : 'повідомлення'}
            </Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: colors.border, true: colors.coral }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Sign Out */}
        <Button
          title={language === 'ru' ? 'Выйти' : 'Вийти'}
          onPress={signOut}
          variant="danger"
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pearl,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.lg,
  },
  authTitle: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  name: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
  },
  b2bCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  b2bRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  b2bLabel: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
  },
  b2bValue: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemTitle: {
    flex: 1,
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  settingLabel: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
});
