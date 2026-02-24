import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { CatalogFilters } from '@/types/product';

interface FilterSheetProps {
  brands: Array<{ id: string; name: string }>;
  initialFilters: CatalogFilters;
  onApply: (filters: CatalogFilters) => void;
  onReset: () => void;
  onClose: () => void;
}

export function FilterSheet({
  brands,
  initialFilters,
  onApply,
  onReset,
  onClose,
}: FilterSheetProps) {
  const { language } = useLanguage();
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice?.toString() ?? '');
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialFilters.brandIds);
  const [inStock, setInStock] = useState(initialFilters.inStock);

  const handleApply = () => {
    onApply({
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      brandIds: selectedBrands,
      inStock,
    });
    onClose();
  };

  const handleReset = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedBrands([]);
    setInStock(false);
    onReset();
    onClose();
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === 'ru' ? 'Фильтры' : 'Фільтри'}
        </Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetText}>
            {language === 'ru' ? 'Сбросить' : 'Скинути'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Price */}
        <Text style={styles.sectionTitle}>
          {language === 'ru' ? 'Цена' : 'Ціна'}
        </Text>
        <View style={styles.priceRow}>
          <View style={styles.priceInput}>
            <Input
              placeholder="Від"
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.priceSeparator}>—</Text>
          <View style={styles.priceInput}>
            <Input
              placeholder="До"
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Brands */}
        {brands.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {language === 'ru' ? 'Бренд' : 'Бренд'}
            </Text>
            <View style={styles.brandsContainer}>
              {brands.map((brand) => (
                <TouchableOpacity
                  key={brand.id}
                  style={[
                    styles.brandChip,
                    selectedBrands.includes(brand.id) && styles.brandChipActive,
                  ]}
                  onPress={() => toggleBrand(brand.id)}
                >
                  <Text
                    style={[
                      styles.brandChipText,
                      selectedBrands.includes(brand.id) &&
                        styles.brandChipTextActive,
                    ]}
                  >
                    {brand.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* In Stock */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>
            {language === 'ru' ? 'В наличии' : 'В наявності'}
          </Text>
          <Switch
            value={inStock}
            onValueChange={setInStock}
            trackColor={{ false: colors.border, true: colors.coral }}
            thumbColor="#fff"
          />
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title={language === 'ru' ? 'Применить' : 'Застосувати'}
          onPress={handleApply}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: fontSizes.lg,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
  },
  resetText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.coral,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  priceInput: {
    flex: 1,
  },
  priceSeparator: {
    color: colors.darkTertiary,
  },
  brandsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  brandChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandChipActive: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },
  brandChipText: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  brandChipTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  switchLabel: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
