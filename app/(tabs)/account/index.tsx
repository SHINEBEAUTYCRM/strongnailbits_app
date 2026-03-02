import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  FileText,
  Gift,
  File,
  Heart,
  ChevronRight,
  Trash2,
  Phone,
} from 'lucide-react-native';
import { colors, fontSizes, borderRadius, spacing, shadows } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { supabase } from '@/lib/supabase/client';
import { ProfileForm } from '@/components/account/ProfileForm';
import { DashboardMetrics } from '@/components/account/DashboardMetrics';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { NPCitySearch } from '@/components/checkout/NPCitySearch';
import { NPWarehouseSelect } from '@/components/checkout/NPWarehouseSelect';
import { Input } from '@/components/ui/Input';

export default function AccountScreen() {
  const router = useRouter();
  const { user, profile, isLoading, isAuthenticated, isB2B } = useAuth();
  const { language } = useLanguage();
  const signOut = useAuthStore((s) => s.signOut);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const pushEnabled = useSettingsStore((s) => s.pushEnabled);
  const setPushEnabled = useSettingsStore((s) => s.setPushEnabled);
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    email: '',
  });
  const [delivery, setDelivery] = useState({
    city: '',
    cityRef: '',
    warehouse: '',
    warehouseRef: '',
    address: '',
  });
  const [ordersCount, setOrdersCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      const meta = (profile as any).metadata ?? {};
      setProfileData({
        firstName: profile.first_name ?? '',
        lastName: profile.last_name ?? '',
        phone: profile.phone ?? '',
        company: profile.company ?? '',
        email: profile.email ?? '',
      });
      setDelivery({
        city: meta.default_city ?? '',
        cityRef: meta.default_city_ref ?? '',
        warehouse: meta.default_warehouse ?? '',
        warehouseRef: meta.default_warehouse_ref ?? '',
        address: meta.default_address ?? '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    // Orders count
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .then(({ count }) => setOrdersCount(count ?? 0));
    // Total spent
    supabase
      .from('orders')
      .select('total')
      .eq('profile_id', user.id)
      .then(({ data }) => {
        const sum = (data ?? []).reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        setTotalSpent(Math.round(sum));
      });
  }, [user]);

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
      const existingMeta = (profile as any)?.metadata ?? {};
      const updateData: Record<string, any> = {
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          email: profileData.email,
          company: profileData.company,
      };
      if (profileData.phone && !profile?.phone) {
        const digits = profileData.phone.replace(/\D/g, '');
        if (digits.length < 10) {
          showToast(
            language === 'ru' ? 'Введите корректный номер' : 'Введіть коректний номер',
            'error',
          );
          setSaving(false);
          return;
        }
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', profileData.phone)
          .neq('id', user.id)
          .maybeSingle();
        if (existing) {
          Alert.alert(
            language === 'ru' ? 'Номер уже используется' : 'Номер вже використовується',
            language === 'ru'
              ? 'Этот номер привязан к другому аккаунту. Войдите через Telegram или SMS с этим номером.'
              : 'Цей номер прив\'язаний до іншого акаунту. Увійдіть через Telegram або SMS з цим номером.',
          );
          setSaving(false);
          return;
        }
        updateData.phone = profileData.phone;
      }
      await supabase
        .from('profiles')
        .update({
          ...updateData,
          metadata: {
            ...existingMeta,
            default_city: delivery.city,
            default_city_ref: delivery.cityRef,
            default_warehouse: delivery.warehouse,
            default_warehouse_ref: delivery.warehouseRef,
            default_address: delivery.address,
          },
        })
        .eq('id', user.id);
      await fetchProfile();
      showToast(language === 'ru' ? 'Профиль сохранён' : 'Профіль збережено', 'success');
    } catch {
      showToast(language === 'ru' ? 'Ошибка сохранения' : 'Помилка збереження', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      language === 'ru' ? 'Удалить аккаунт?' : 'Видалити акаунт?',
      language === 'ru'
        ? 'Все данные будут удалены. Это действие нельзя отменить.'
        : 'Всі дані буде видалено. Цю дію не можна скасувати.',
      [
        { text: language === 'ru' ? 'Отмена' : 'Скасувати', style: 'cancel' },
        {
          text: language === 'ru' ? 'Удалить' : 'Видалити',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            showToast(language === 'ru' ? 'Аккаунт удалён' : 'Акаунт видалено', 'info');
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: <FileText size={22} color={colors.violet} />,
      title: language === 'ru' ? 'Замовлення' : 'Замовлення',
      subtitle: ordersCount > 0 ? `${ordersCount}` : undefined,
      route: '/(tabs)/account/orders',
    },
    {
      icon: <Gift size={22} color={colors.coral} />,
      title: language === 'ru' ? 'Бонуси' : 'Бонуси',
      subtitle: `${profile?.loyalty_points ?? 0} балів`,
      route: '/(tabs)/account/bonuses',
    },
    {
      icon: <File size={22} color={colors.amber} />,
      title: language === 'ru' ? 'Документи' : 'Документи',
      subtitle: language === 'ru' ? 'Накладные из 1С' : 'Накладні з 1С',
      route: '/(tabs)/account/documents',
    },
    {
      icon: <Heart size={22} color={colors.coral} />,
      title: language === 'ru' ? 'Обране' : 'Обране',
      subtitle: language === 'ru' ? 'Список желаний' : 'Список бажань',
      route: '/(tabs)/wishlist',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.headerCard}>
          <Text style={styles.name}>
            {profile?.first_name} {profile?.last_name}
          </Text>
          {profile?.phone && (
            <View style={styles.phoneRow}>
              <Phone size={14} color={colors.darkTertiary} />
              <Text style={styles.phoneText}>{profile.phone}</Text>
            </View>
          )}
          {isB2B && profile?.discount_percent ? (
            <View style={styles.b2bBadge}>
              <Text style={styles.b2bBadgeText}>B2B • Знижка {profile.discount_percent}%</Text>
            </View>
          ) : null}
        </View>

        {/* Dashboard Metrics */}
        <DashboardMetrics
          ordersCount={ordersCount}
          totalSpent={totalSpent}
          bonusPoints={profile?.loyalty_points ?? 0}
          balance={Number((profile as any)?.balance ?? 0)}
        />

        {/* Quick Links */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => router.push(item.route as never)}
            >
              {item.icon}
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                )}
              </View>
              <ChevronRight size={20} color={colors.darkTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Personal Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'ru' ? 'Личные данные' : 'Особисті дані'}
          </Text>
          <ProfileForm data={profileData} onChange={setProfileData} />
        </View>

        {/* Delivery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'ru' ? 'Доставка' : 'Доставка'}
          </Text>
          <NPCitySearch
            value={delivery.city}
            cityRef={delivery.cityRef}
            onSelect={({ ref, name }) =>
              setDelivery((d) => ({ ...d, city: name, cityRef: ref, warehouse: '', warehouseRef: '' }))
            }
            onClear={() => setDelivery((d) => ({ ...d, city: '', cityRef: '', warehouse: '', warehouseRef: '' }))}
          />
          <NPWarehouseSelect
            cityName={delivery.city}
            value={delivery.warehouse}
            onSelect={({ ref, name }) =>
              setDelivery((d) => ({ ...d, warehouse: name, warehouseRef: ref }))
            }
            onClear={() => setDelivery((d) => ({ ...d, warehouse: '', warehouseRef: '' }))}
          />
          <Input
            label={language === 'ru' ? 'Адрес доставки' : 'Адреса доставки'}
            value={delivery.address}
            onChangeText={(address) => setDelivery((d) => ({ ...d, address }))}
            placeholder={language === 'ru' ? 'Для курьерской доставки' : 'Для адресної доставки кур\'єром'}
          />
        </View>

        {/* Save Button */}
        <Button
          title={language === 'ru' ? 'Сохранить' : 'Зберегти'}
          onPress={handleSaveProfile}
          loading={saving}
          fullWidth
        />

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

        {/* Delete Account */}
        <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteButton}>
          <Trash2 size={16} color={colors.darkTertiary} />
          <Text style={styles.deleteText}>
            {language === 'ru' ? 'Удалить аккаунт' : 'Видалити акаунт'}
          </Text>
        </TouchableOpacity>
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
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.sm,
  },
  name: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  phoneText: {
    fontSize: fontSizes.sm,
    fontFamily: 'JetBrainsMono-Regular',
    color: colors.darkSecondary,
  },
  b2bBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.violet + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    marginTop: spacing.xs,
  },
  b2bBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-SemiBold',
    color: colors.violet,
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
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  menuItemSubtitle: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
    marginTop: 2,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  deleteText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
  },
});
