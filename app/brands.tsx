import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Image } from 'expo-image';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/lib/supabase/client';
import { Loading } from '@/components/ui/Loading';
import { BottomNavBar } from '@/components/ui/BottomNavBar';
import type { Brand } from '@/types/product';

export default function BrandsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    try {
      const { data } = await supabase
        .from('brands')
        .select('id, name, slug, logo_url')
        .order('name');
      setBrands((data ?? []) as Brand[]);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const sections = useMemo(() => {
    const grouped: Record<string, Brand[]> = {};
    brands.forEach((brand) => {
      const letter = brand.name[0]?.toUpperCase() ?? '#';
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(brand);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, data]) => ({ title, data }));
  }, [brands]);

  const letters = sections.map((s) => s.title);

  if (isLoading) return <Loading fullScreen />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {language === 'ru' ? 'Бренды' : 'Бренди'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Alphabet index */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.alphabetContainer}
      >
        {letters.map((letter) => (
          <TouchableOpacity key={letter} style={styles.letterChip}>
            <Text style={styles.letterText}>{letter}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionList
        sections={sections}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.brandItem}
            onPress={() => router.push(`/(tabs)/catalog?brand=${item.slug}` as never)}
          >
            {item.logo_url && (
              <Image
                source={{ uri: item.logo_url }}
                style={styles.brandLogo}
                contentFit="contain"
              />
            )}
            <Text style={styles.brandName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

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
  alphabetContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  letterChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  letterText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
  },
  list: {
    paddingBottom: spacing['3xl'],
  },
  sectionHeader: {
    fontSize: fontSizes.lg,
    fontFamily: 'Unbounded-Bold',
    color: colors.coral,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.pearl,
  },
  brandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
  },
  brandName: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
});
