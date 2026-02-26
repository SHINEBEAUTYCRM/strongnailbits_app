import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, fontSizes, spacing } from '@/theme';

interface BreadcrumbItem {
  label: string;
  slug?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const router = useRouter();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight size={14} color={colors.darkTertiary} style={styles.separator} />
          )}
          {item.slug ? (
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/catalog/${item.slug}`)}
            >
              <Text style={styles.link}>{item.label}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.current}>{item.label}</Text>
          )}
        </React.Fragment>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  separator: {
    marginHorizontal: spacing.xs,
  },
  link: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.coral,
  },
  current: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Medium',
    color: colors.darkSecondary,
  },
});
