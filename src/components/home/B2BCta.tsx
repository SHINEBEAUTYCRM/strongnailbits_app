import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { fontSizes, borderRadius, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/hooks/useLanguage';

export function B2BCta() {
  const router = useRouter();
  const { language } = useLanguage();

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#D6264A', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <Text style={styles.title}>
          {language === 'ru' ? 'Оптовым клиентам' : 'Оптовим клієнтам'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'ru'
            ? 'Специальные цены, персональный менеджер, лояльная программа'
            : 'Спеціальні ціни, персональний менеджер, лояльна програма'}
        </Text>
        <Button
          title={language === 'ru' ? 'Узнать больше' : 'Дізнатися більше'}
          onPress={() => router.push('/page/wholesale')}
          variant="secondary"
          size="md"
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
  },
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'Unbounded-Bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
});
