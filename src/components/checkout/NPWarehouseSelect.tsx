import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import { Search, X, Package, Clock } from 'lucide-react-native';
import { colors, spacing, fontSizes, borderRadius } from '@/theme';
import { searchWarehouses } from '@/lib/novaposhta/api';
import type { NPWarehouse } from '@/lib/novaposhta/api';

interface NPWarehouseSelectProps {
  cityName: string;
  value: string;
  onSelect: (warehouse: { ref: string; name: string; number: number }) => void;
  onClear: () => void;
  error?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  branch: '📦',
  postomat: '🏧',
  cargo: '🚛',
};

export function NPWarehouseSelect({
  cityName,
  value,
  onSelect,
  onClear,
  error,
}: NPWarehouseSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [warehouses, setWarehouses] = useState<NPWarehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const loadWarehouses = async (q?: string) => {
    if (!cityName) return;
    setLoading(true);
    try {
      const result = await searchWarehouses(cityName, q);
      setWarehouses(result);
    } catch {
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      setQuery('');
      loadWarehouses();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [modalVisible, cityName]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadWarehouses(query.trim() || undefined);
    }, 300);
  }, [query]);

  const handleSelect = (w: NPWarehouse) => {
    Keyboard.dismiss();
    onSelect({ ref: w.id, name: w.name, number: w.number });
    setModalVisible(false);
  };

  const disabled = !cityName;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          error ? styles.triggerError : value ? styles.triggerSelected : null,
          disabled && styles.triggerDisabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={styles.triggerIcon}>📦</Text>
        <Text
          style={[styles.triggerText, !value && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {value || (disabled ? 'Спочатку оберіть місто' : 'Оберіть відділення / поштомат')}
        </Text>
        {value ? (
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); onClear(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color={colors.darkSecondary} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modal}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Відділення / поштомат</Text>
                <Text style={styles.modalSubtitle}>{cityName}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <Search size={18} color={colors.darkTertiary} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Номер або адреса відділення..."
                placeholderTextColor={colors.darkTertiary}
                autoCorrect={false}
                keyboardType="default"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <X size={16} color={colors.darkTertiary} />
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <ActivityIndicator style={{ marginTop: spacing['2xl'] }} color={colors.coral} />
            ) : (
              <FlatList
                data={warehouses}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.warehouseItem} onPress={() => handleSelect(item)}>
                    <Text style={styles.warehouseIcon}>
                      {CATEGORY_ICONS[item.category] ?? '📦'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.warehouseName} numberOfLines={2}>
                        {item.shortName || item.name}
                      </Text>
                      {item.address && (
                        <Text style={styles.warehouseAddress} numberOfLines={1}>
                          {item.address}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    {cityName ? 'Відділення не знайдено' : 'Оберіть місто'}
                  </Text>
                }
              />
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    minHeight: 52,
  },
  triggerError: {
    borderColor: colors.red,
  },
  triggerSelected: {
    borderColor: colors.coral,
  },
  triggerDisabled: {
    backgroundColor: colors.sand,
    opacity: 0.6,
  },
  triggerIcon: {
    fontSize: 18,
  },
  triggerText: {
    flex: 1,
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.dark,
  },
  triggerPlaceholder: {
    color: colors.darkTertiary,
  },
  errorText: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.red,
    marginTop: 4,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.pearl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
  },
  modalSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.coral,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.dark,
  },
  warehouseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  warehouseIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  warehouseName: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
    lineHeight: 20,
  },
  warehouseAddress: {
    fontSize: fontSizes.xs,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing['2xl'],
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
  },
});
