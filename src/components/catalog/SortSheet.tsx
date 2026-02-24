import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, fontSizes, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { SORT_OPTIONS, SortOption } from '@/types/product';

interface SortSheetProps {
  current: SortOption;
  onSelect: (sort: SortOption) => void;
  onClose: () => void;
}

export function SortSheet({ current, onSelect, onClose }: SortSheetProps) {
  const { language } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {language === 'ru' ? 'Сортировка' : 'Сортування'}
      </Text>
      {SORT_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={styles.option}
          onPress={() => {
            onSelect(option.value);
            onClose();
          }}
        >
          <Text
            style={[
              styles.optionText,
              current === option.value && styles.optionTextActive,
            ]}
          >
            {language === 'ru' ? option.label_ru : option.label_uk}
          </Text>
          {current === option.value && (
            <Check size={20} color={colors.coral} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  title: {
    fontSize: fontSizes.lg,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  optionText: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.dark,
  },
  optionTextActive: {
    fontFamily: 'Inter-SemiBold',
    color: colors.coral,
  },
});
