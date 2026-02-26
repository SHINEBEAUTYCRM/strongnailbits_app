import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { colors, fontSizes, spacing } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/lib/supabase/client';
import { OrderCard } from '@/components/account/OrderCard';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Order } from '@/types/order';

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  async function fetchOrders() {
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('profile_id', user!.id)
        .order('created_at', { ascending: false });

      setOrders((data ?? []) as Order[]);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {language === 'ru' ? 'Мои заказы' : 'Мої замовлення'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <Loading fullScreen />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<FileText size={64} color={colors.darkTertiary} />}
          title={language === 'ru' ? 'У вас пока нет заказов' : 'У вас поки немає замовлень'}
          actionTitle={language === 'ru' ? 'Перейти в каталог' : 'Перейти до каталогу'}
          onAction={() => router.push('/(tabs)/catalog')}
        />
      ) : (
        <FlatList
          data={orders}
          renderItem={({ item }) => <OrderCard order={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
