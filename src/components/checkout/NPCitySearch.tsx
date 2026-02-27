import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Search, X, MapPin, ChevronDown } from 'lucide-react-native';
import { colors, spacing, fontSizes, borderRadius } from '@/theme';
import { searchCities, getPopularCities } from '@/lib/novaposhta/api';
import type { NPCity } from '@/lib/novaposhta/api';

interface NPCitySearchProps {
  value: string;
  cityRef: string;
  onSelect: (city: { ref: string; name: string; deliveryCityRef?: string }) => void;
  onClear: () => void;
  error?: string;
}

export function NPCitySearch({ value, cityRef, onSelect, onClear, error }: NPCitySearchProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [cities, setCities] = useState<NPCity[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const loadPopular = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPopularCities();
      setCities(result);
    } catch {
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (modalVisible) {
      setQuery('');
      loadPopular();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [modalVisible]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      loadPopular();
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await searchCities(query.trim());
        setCities(result);
      } catch {
        setCities([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const handleSelect = (city: NPCity) => {
    Keyboard.dismiss();
    onSelect({ ref: city.ref, name: city.name, deliveryCityRef: city.deliveryCityRef });
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, error ? styles.triggerError : cityRef ? styles.triggerSelected : null]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <MapPin size={18} color={cityRef ? colors.coral : colors.darkTertiary} />
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]} numberOfLines={1}>
          {value || 'Оберіть місто'}
        </Text>
        {value ? (
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); onClear(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color={colors.darkSecondary} />
          </TouchableOpacity>
        ) : (
          <ChevronDown size={16} color={colors.darkTertiary} />
        )}
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modal}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Оберіть місто</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.dark} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
              <Search size={18} color={colors.darkTertiary} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Пошук міста..."
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
                data={cities}
                keyExtractor={(item) => item.ref}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.cityItem} onPress={() => handleSelect(item)}>
                    <MapPin size={16} color={colors.darkTertiary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cityName}>{item.name}</Text>
                      {item.area && (
                        <Text style={styles.cityArea}>{item.area}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    {query ? 'Міст не знайдено' : 'Введіть назву міста'}
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
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  cityName: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  cityArea: {
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
