import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ChevronRight, ChevronDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, fontSizes, borderRadius, spacing, shadows } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import type { Category } from '@/types/product';

interface CategoryTreeProps {
  categories: Category[];
}

export function CategoryTree({ categories }: CategoryTreeProps) {
  return (
    <View style={styles.container}>
      {categories.map((category) => (
        <CategoryItem key={category.id} category={category} level={0} />
      ))}
    </View>
  );
}

function CategoryItem({ category, level }: { category: Category; level: number }) {
  const router = useRouter();
  const { tField } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  const handlePress = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else {
      router.push(`/(tabs)/catalog/${category.slug}`);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.item, { paddingLeft: spacing.lg + level * spacing.xl }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {category.image_url && (
          <Image
            source={{ uri: category.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {tField(category.name_uk, category.name_ru)}
          </Text>
          {category.product_count > 0 && (
            <Text style={styles.count}>{category.product_count}</Text>
          )}
        </View>
        {hasChildren ? (
          expanded ? (
            <ChevronDown size={20} color={colors.darkTertiary} />
          ) : (
            <ChevronRight size={20} color={colors.darkTertiary} />
          )
        ) : (
          <ChevronRight size={20} color={colors.darkTertiary} />
        )}
      </TouchableOpacity>

      {expanded && hasChildren && (
        <View>
          {/* Direct link to all products in this category */}
          <TouchableOpacity
            style={[styles.item, { paddingLeft: spacing.lg + (level + 1) * spacing.xl }]}
            onPress={() => router.push(`/(tabs)/catalog/${category.slug}`)}
            activeOpacity={0.7}
          >
            <Text style={[styles.name, { color: colors.coral }]}>
              Усі товари
            </Text>
            <ChevronRight size={20} color={colors.coral} />
          </TouchableOpacity>
          {category.children!.map((child) => (
            <CategoryItem key={child.id} category={child} level={level + 1} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.sand,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  count: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
    backgroundColor: colors.sand,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
});
