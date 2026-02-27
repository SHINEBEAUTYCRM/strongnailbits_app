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
import { Search, X, Navigation } from 'lucide-react-native';
import { colors, spacing, fontSizes, borderRadius } from '@/theme';
import { searchStreets } from '@/lib/novaposhta/api';
import type { NPStreet } from '@/lib/novaposhta/api';

interface NPStreetSearchProps {
  cityRef: string;
  value: string;
  onSelect: (street: { ref: string; name: string }) => void;
  onClear: () => void;
  error?: string;
}

export function NPStreetSearch({ cityRef, value, onSelect, onClear, error }: NPStreetSearchProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [streets, setStreets] = useState<NPStreet[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (modalVisible) {
      setQuery('');
      setStreets([]);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [modalVisible]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || !cityRef) {
      setStreets([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await searchStreets(cityRef, query.trim());
        setStreets(result);
      } catch {
        setStreets([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query, cityRef]);

  const handleSelect = (street: NPStreet) => {
    Keyboard.dismiss();
    onSelect({ ref: street.ref, name: street.name });
    setModalVisible(false);
  };

  const disabled = !cityRef;

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
        <Navigation size={18} color={value ? colors.coral : colors.darkTertiary} />
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]} numberOfLines={1}>
          {value || (disabled ? 'Спочатку оберіть місто' : 'Оберіть вулицю')}
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
              <Text style={styles.modalTitle}>Оберіть вулицю</Text>
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
                placeholder="Назва вулиці..."
                placeholderTextColor={colors.darkTertiary}
                autoCorrect={false}
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
                data={streets}
                keyExtractor={(item) => item.ref}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.streetItem} onPress={() => handleSelect(item)}>
                    <Navigation size={16} color={colors.darkTertiary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.streetName}>{item.name}</Text>
                      {item.type && (
                        <Text style={styles.streetType}>{item.type}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    {query.length < 2
                      ? 'Введіть мінімум 2 символи'
                      : 'Вулиць не знайдено'}
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
  streetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  streetName: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  streetType: {
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
