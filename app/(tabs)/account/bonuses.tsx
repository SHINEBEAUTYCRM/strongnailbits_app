import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { colors, fontSizes, borderRadius, spacing, shadows } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/lib/supabase/client';
import { BonusCard } from '@/components/account/BonusCard';
import { Loading } from '@/components/ui/Loading';
import type { Bonus } from '@/types/profile';

export default function BonusesScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchBonuses();
  }, [user]);

  async function fetchBonuses() {
    try {
      const { data } = await supabase
        .from('bonuses')
        .select('*')
        .eq('profile_id', user!.id)
        .order('created_at', { ascending: false });

      setBonuses((data ?? []) as Bonus[]);
    } catch (error) {
      console.error('Failed to fetch bonuses:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) return <Loading fullScreen />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {language === 'ru' ? 'Бонусы' : 'Бонуси'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Balance Card */}
      <View style={[styles.balanceCard, shadows.md]}>
        <Text style={styles.balanceLabel}>
          {language === 'ru' ? 'Баланс бонусов' : 'Баланс бонусів'}
        </Text>
        <Text style={styles.balanceValue}>
          {profile?.loyalty_points ?? 0} {language === 'ru' ? 'баллов' : 'балів'}
        </Text>
        <Text style={styles.tier}>
          {language === 'ru' ? 'Тир' : 'Тір'}: {profile?.loyalty_tier ?? 'Bronze'}
        </Text>
      </View>

      <FlatList
        data={bonuses}
        renderItem={({ item }) => <BonusCard bonus={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
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
  balanceCard: {
    margin: spacing.lg,
    padding: spacing['2xl'],
    backgroundColor: colors.coral,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  balanceLabel: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  balanceValue: {
    fontSize: fontSizes['3xl'],
    fontFamily: 'Unbounded-Bold',
    color: '#fff',
  },
  tier: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.9)',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
});
