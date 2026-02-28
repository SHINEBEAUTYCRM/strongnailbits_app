import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LayoutGrid } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';

interface CategoryBlockChild {
  id: string;
  slug: string;
  name_uk: string;
  name_ru: string | null;
  image_url: string | null;
  product_count: number;
}

interface CategoryBlock {
  id: string;
  title_uk: string;
  title_ru: string | null;
  subtitle_uk: string | null;
  subtitle_ru: string | null;
  parent_slug: string;
  children: CategoryBlockChild[];
}

export function CategoryBlockCard({ block }: { block: CategoryBlock }) {
  const router = useRouter();
  const { language, tField } = useLanguage();
  const title = tField(block.title_uk, block.title_ru);
  const subtitle = tField(block.subtitle_uk, block.subtitle_ru);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.grid}>
        {block.children.slice(0, 4).map((child) => (
          <TouchableOpacity
            key={child.id}
            style={styles.gridItem}
            onPress={() => router.push(`/(tabs)/catalog/${child.slug}`)}
            activeOpacity={0.7}
          >
            <View style={styles.imageBox}>
              {child.image_url ? (
                <Image
                  source={{ uri: child.image_url }}
                  style={styles.image}
                  contentFit="contain"
                  transition={200}
                />
              ) : (
                <View style={styles.placeholder}>
                  <LayoutGrid size={24} color={colors.darkTertiary} />
                </View>
              )}
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {tField(child.name_uk, child.name_ru)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => router.push(`/(tabs)/catalog/${block.parent_slug}`)}
        style={styles.seeMore}
      >
        <Text style={styles.seeMoreText}>
          {language === 'ru' ? 'Смотреть все' : 'Дивитись все'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: 8,
  },
  gridItem: {
    width: '48%' as any,
  },
  imageBox: {
    aspectRatio: 1.2,
    borderRadius: 12,
    backgroundColor: colors.sand,
    overflow: 'hidden',
    marginBottom: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
    lineHeight: 17,
  },
  seeMore: {
    marginTop: spacing.md,
  },
  seeMoreText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: colors.coral,
  },
});
