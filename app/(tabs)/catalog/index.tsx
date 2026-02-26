import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryTree } from '@/components/catalog/CategoryTree';
import { Loading } from '@/components/ui/Loading';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, fontSizes, spacing } from '@/theme';
import { Text, View } from 'react-native';

export default function CatalogIndexScreen() {
  const { tree, isLoading } = useCategoryTree();
  const { language } = useLanguage();

  if (isLoading) return <Loading fullScreen />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === 'ru' ? 'Каталог' : 'Каталог'}
        </Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <CategoryTree categories={tree} />
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['3xl'],
  },
});
