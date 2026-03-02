import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react-native';
import { colors, fontSizes, borderRadius, spacing, shadows } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useNotifications } from '@/hooks/useNotifications';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { BottomNavBar } from '@/components/ui/BottomNavBar';
import { formatDateTime } from '@/utils/format';
import type { NotificationFeedItem } from '@/types/profile';

export default function NotificationsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount } =
    useNotifications();

  const renderItem = ({ item }: { item: NotificationFeedItem }) => (
    <TouchableOpacity
      style={[styles.notifCard, !item.is_read && styles.notifUnread, shadows.sm]}
      onPress={() => {
        if (!item.is_read) markAsRead(item.id);
        if (item.link) router.push(item.link as never);
      }}
    >
      <View style={styles.notifHeader}>
        <Text style={styles.notifType}>{item.type}</Text>
        <Text style={styles.notifTime}>{formatDateTime(item.created_at)}</Text>
      </View>
      <Text style={styles.notifTitle}>{item.title}</Text>
      <Text style={styles.notifBody} numberOfLines={2}>
        {item.body}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {language === 'ru' ? 'Уведомления' : 'Сповіщення'}
        </Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead}>
            <CheckCheck size={22} color={colors.coral} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {isLoading ? (
        <Loading fullScreen />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={64} color={colors.darkTertiary} />}
          title={language === 'ru' ? 'Нет уведомлений' : 'Немає сповіщень'}
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNavBar />
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
  notifCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  notifUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.coral,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notifType: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Medium',
    color: colors.violet,
    textTransform: 'uppercase',
  },
  notifTime: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
  },
  notifTitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
  },
  notifBody: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    lineHeight: 18,
  },
});
