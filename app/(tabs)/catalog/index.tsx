import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Search, LayoutGrid } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { Loading } from '@/components/ui/Loading';
import { colors, spacing, shadows } from '@/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 8;
const GRID_PADDING = spacing.lg;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3;

export default function CatalogIndexScreen() {
  const { tree, isLoading } = useCategoryTree();
  const router = useRouter();

  if (isLoading) return <Loading fullScreen />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Каталог</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={0.7}
        >
          <Search size={20} color={colors.darkTertiary} />
          <Text style={styles.searchPlaceholder}>Пошук товарів...</Text>
        </TouchableOpacity>

        {/* Category Grid */}
        <View style={styles.grid}>
          {tree.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, shadows.sm]}
              onPress={() => router.push(`/(tabs)/catalog/${category.slug}`)}
              activeOpacity={0.7}
            >
              {category.image_url ? (
                <Image
                  source={{ uri: category.image_url }}
                  style={styles.categoryImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.categoryPlaceholder}>
                  <LayoutGrid size={28} color={colors.darkTertiary} />
                </View>
              )}
              <Text style={styles.categoryName} numberOfLines={2}>
                {category.name_uk}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pearl,
  },
  header: {
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sand,
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    height: 44,
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
  },
  categoryCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  categoryImage: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: colors.sand,
  },
  categoryPlaceholder: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    lineHeight: 16,
  },
});
