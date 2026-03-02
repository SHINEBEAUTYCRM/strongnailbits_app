import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Search as SearchIcon } from 'lucide-react-native';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useSearch } from '@/hooks/useSearch';
import { SearchBar } from '@/components/ui/SearchBar';
import { ProductGrid } from '@/components/product/ProductGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { BottomNavBar } from '@/components/ui/BottomNavBar';

export default function SearchScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { query, setQuery, products, brands, isLoading, hasSearched } = useSearch();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder={language === 'ru' ? 'Искать товары...' : 'Шукати товари...'}
          />
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={colors.dark} />
        </TouchableOpacity>
      </View>

      {/* Brand chips */}
      {brands.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.brandsContainer}
        >
          {brands.map((brand) => (
            <TouchableOpacity
              key={brand.id}
              style={styles.brandChip}
              onPress={() => router.push(`/(tabs)/catalog?brand=${brand.slug}`)}
            >
              <Text style={styles.brandChipText}>{brand.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results */}
      {isLoading ? (
        <Loading />
      ) : hasSearched && products.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={64} color={colors.darkTertiary} />}
          title={
            language === 'ru'
              ? `По запросу «${query}» ничего не найдено`
              : `За запитом «${query}» нічого не знайдено`
          }
          subtitle={
            language === 'ru'
              ? 'Проверьте написание или используйте другие слова'
              : 'Перевірте написання або використайте інші слова'
          }
        />
      ) : (
        <ProductGrid products={products} />
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
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchContainer: {
    flex: 1,
  },
  brandsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  brandChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.violet,
    borderRadius: borderRadius.pill,
    marginRight: spacing.sm,
  },
  brandChipText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: '#fff',
  },
});
