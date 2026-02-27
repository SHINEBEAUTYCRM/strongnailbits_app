import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Phone, Mail, MapPin } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { colors, fontSizes, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppConfig } from '@/hooks/useAppConfig';
import { supabase } from '@/lib/supabase/client';
import { Loading } from '@/components/ui/Loading';

interface PageData {
  title_uk: string;
  title_ru: string | null;
  content_uk: string;
  content_ru: string | null;
}

export default function CmsPageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { language, tField } = useLanguage();
  const config = useAppConfig();
  const [page, setPage] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) fetchPage();
  }, [slug]);

  async function fetchPage() {
    try {
      const { data } = await supabase
        .from('pages')
        .select('title_uk, title_ru, content_uk, content_ru')
        .eq('slug', slug)
        .single();

      if (data) setPage(data as PageData);
    } catch (error) {
      console.error('Failed to fetch page:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) return <Loading fullScreen />;
  if (!page) return null;

  const title = tField(page.title_uk, page.title_ru);
  const content = tField(page.content_uk, page.content_ru);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact info for contacts page */}
        {slug === 'contacts' && (
          <View style={styles.contactCards}>
            {config.phone && (
              <TouchableOpacity
                style={styles.contactCard}
                onPress={() => Linking.openURL(`tel:${config.phone}`)}
              >
                <Phone size={20} color={colors.coral} />
                <Text style={styles.contactText}>{config.phone}</Text>
              </TouchableOpacity>
            )}
            {config.email && (
              <TouchableOpacity
                style={styles.contactCard}
                onPress={() => Linking.openURL(`mailto:${config.email}`)}
              >
                <Mail size={20} color={colors.coral} />
                <Text style={styles.contactText}>{config.email}</Text>
              </TouchableOpacity>
            )}
            {config.address && (
              <View style={styles.contactCard}>
                <MapPin size={20} color={colors.coral} />
                <Text style={styles.contactText}>{config.address}</Text>
              </View>
            )}
          </View>
        )}

        {/* Markdown content */}
        {content ? (
          <Markdown style={markdownStyles}>{content}</Markdown>
        ) : (
          <Text style={styles.emptyText}>
            {language === 'ru' ? 'Контент отсутствует' : 'Контент відсутній'}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.dark,
    lineHeight: 24,
  },
  heading1: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'Unbounded-Bold',
    color: colors.dark,
    marginVertical: spacing.lg,
  },
  heading2: {
    fontSize: fontSizes.xl,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
    marginVertical: spacing.md,
  },
  heading3: {
    fontSize: fontSizes.lg,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
    marginVertical: spacing.md,
  },
  link: {
    color: colors.coral,
  },
  strong: {
    fontFamily: 'Inter-Bold',
  },
});

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
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.lg,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
    marginHorizontal: spacing.md,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  contactCards: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
  },
  contactText: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  emptyText: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
    textAlign: 'center',
    marginTop: spacing['3xl'],
  },
});
