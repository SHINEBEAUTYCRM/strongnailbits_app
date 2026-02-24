import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.option, language === 'uk' && styles.active]}
        onPress={() => setLanguage('uk')}
      >
        <Text style={[styles.text, language === 'uk' && styles.activeText]}>
          UA
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.option, language === 'ru' && styles.active]}
        onPress={() => setLanguage('ru')}
      >
        <Text style={[styles.text, language === 'ru' && styles.activeText]}>
          RU
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.sand,
    borderRadius: borderRadius.pill,
    padding: 2,
  },
  option: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  active: {
    backgroundColor: colors.white,
  },
  text: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.darkSecondary,
  },
  activeText: {
    color: colors.dark,
  },
});
