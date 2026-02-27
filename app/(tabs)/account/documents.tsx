import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, File } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { colors, fontSizes, spacing } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/lib/supabase/client';
import { DocumentCard } from '@/components/account/DocumentCard';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Document } from '@/types/profile';

export default function DocumentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user]);

  async function fetchDocuments() {
    try {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('profile_id', user!.id)
        .order('doc_date', { ascending: false });

      setDocuments((data ?? []) as Document[]);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {language === 'ru' ? 'Документы' : 'Документи'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <Loading fullScreen />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<File size={64} color={colors.darkTertiary} />}
          title={language === 'ru' ? 'Нет документов' : 'Немає документів'}
        />
      ) : (
        <FlatList
          data={documents}
          renderItem={({ item }) => <DocumentCard document={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
});
