import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { X, ChevronDown } from 'lucide-react-native';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { Input } from '@/components/ui/Input';
import { NPCitySearch } from './NPCitySearch';
import { NPWarehouseSelect } from './NPWarehouseSelect';
import { NPStreetSearch } from './NPStreetSearch';
import { NPDeliveryCost } from './NPDeliveryCost';
import { useCartStore } from '@/stores/cart';

export interface ShippingData {
  method: string;
  city: string;
  cityRef: string;
  deliveryCityRef: string;
  warehouse: string;
  warehouseRef: string;
  street: string;
  streetRef: string;
  house: string;
  address: string;
  country: string;
  intlCity: string;
  intlAddress: string;
  intlPostcode: string;
}

interface ShippingFormProps {
  data: ShippingData;
  onChange: (data: ShippingData) => void;
}

const SHIPPING_METHODS = [
  { id: 'np_warehouse', label_uk: 'Нова Пошта — відділення / поштомат', label_ru: 'Новая Почта — отделение / почтомат', icon: '📦' },
  { id: 'np_address', label_uk: 'Нова Пошта — адресна доставка', label_ru: 'Новая Почта — адресная доставка', icon: '🚚' },
  { id: 'ukrposhta', label_uk: 'Укрпошта', label_ru: 'Укрпочта', icon: '📬' },
  { id: 'pickup', label_uk: 'Самовивіз (Одеса)', label_ru: 'Самовывоз (Одесса)', icon: '🏪' },
  { id: 'np_intl', label_uk: 'Нова Пошта Інтернешнл', label_ru: 'Нова Пошта Интернешнл', icon: '🌍' },
  { id: 'ukrposhta_intl', label_uk: 'Укрпошта — міжнародна', label_ru: 'Укрпочта — международная', icon: '✈️' },
];

const COUNTRIES = [
  'Польща', 'Німеччина', 'Чехія', 'Італія', 'Іспанія', 'Румунія',
  'Молдова', 'Грузія', 'Литва', 'Латвія', 'Естонія', 'Великобританія',
  'США', 'Канада', 'Ізраїль', 'Туреччина', 'Франція', 'Нідерланди',
  'Португалія', 'Болгарія', 'Інша країна',
];

const COUNTRIES_RU: Record<string, string> = {
  'Польща': 'Польша', 'Німеччина': 'Германия', 'Чехія': 'Чехия',
  'Італія': 'Италия', 'Іспанія': 'Испания', 'Румунія': 'Румыния',
  'Молдова': 'Молдова', 'Грузія': 'Грузия', 'Литва': 'Литва',
  'Латвія': 'Латвия', 'Естонія': 'Эстония', 'Великобританія': 'Великобритания',
  'США': 'США', 'Канада': 'Канада', 'Ізраїль': 'Израиль',
  'Туреччина': 'Турция', 'Франція': 'Франция', 'Нідерланди': 'Нидерланды',
  'Португалія': 'Португалия', 'Болгарія': 'Болгария', 'Інша країна': 'Другая страна',
};

function CountryPicker({
  value,
  onSelect,
  language,
  error,
}: {
  value: string;
  onSelect: (country: string) => void;
  language: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  const displayValue = value
    ? (language === 'ru' ? (COUNTRIES_RU[value] ?? value) : value)
    : null;

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, error ? styles.triggerError : value ? styles.triggerSelected : null]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]} numberOfLines={1}>
          {displayValue || (language === 'ru' ? 'Выберите страну' : 'Оберіть країну')}
        </Text>
        <ChevronDown size={16} color={colors.darkTertiary} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {language === 'ru' ? 'Выберите страну' : 'Оберіть країну'}
            </Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <X size={24} color={colors.dark} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.countryItem, value === item && styles.countryItemActive]}
                onPress={() => { onSelect(item); setVisible(false); }}
              >
                <Text style={[styles.countryName, value === item && styles.countryNameActive]}>
                  {language === 'ru' ? (COUNTRIES_RU[item] ?? item) : item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

export function ShippingForm({ data, onChange }: ShippingFormProps) {
  const { language } = useLanguage();
  const totalWeight = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + (item.weight ?? 0) * item.quantity, 0)
  );
  const total = useCartStore((s) => s.getTotal());

  const isIntl = data.method === 'np_intl' || data.method === 'ukrposhta_intl';

  const clearCity = () =>
    onChange({
      ...data,
      city: '',
      cityRef: '',
      deliveryCityRef: '',
      warehouse: '',
      warehouseRef: '',
      street: '',
      streetRef: '',
    });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {language === 'ru' ? 'Способ доставки' : 'Спосіб доставки'}
      </Text>

      {/* Method selector */}
      {SHIPPING_METHODS.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.methodCard,
            data.method === method.id && styles.methodCardActive,
          ]}
          onPress={() => onChange({ ...data, method: method.id })}
        >
          <Text style={styles.methodIcon}>{method.icon}</Text>
          <Text style={[
            styles.methodName,
            data.method === method.id && styles.methodNameActive,
          ]}>
            {language === 'ru' ? method.label_ru : method.label_uk}
          </Text>
        </TouchableOpacity>
      ))}

      {/* np_warehouse: місто + відділення + вартість */}
      {data.method === 'np_warehouse' && (
        <View style={styles.fields}>
          <Text style={styles.fieldLabel}>
            {language === 'ru' ? 'Город' : 'Місто'}
          </Text>
          <NPCitySearch
            value={data.city}
            cityRef={data.cityRef}
            onSelect={(city) =>
              onChange({
                ...data,
                city: city.name,
                cityRef: city.ref,
                deliveryCityRef: city.deliveryCityRef ?? '',
                warehouse: '',
                warehouseRef: '',
              })
            }
            onClear={clearCity}
          />
          <Text style={styles.fieldLabel}>
            {language === 'ru' ? 'Отделение / почтомат' : 'Відділення / поштомат'}
          </Text>
          <NPWarehouseSelect
            cityName={data.city}
            value={data.warehouse}
            onSelect={(w) => onChange({ ...data, warehouse: w.name, warehouseRef: w.ref })}
            onClear={() => onChange({ ...data, warehouse: '', warehouseRef: '' })}
          />
          {data.cityRef && (
            <NPDeliveryCost
              cityRef={data.deliveryCityRef || data.cityRef}
              weight={totalWeight || 1}
              cost={total}
              serviceType="WarehouseWarehouse"
            />
          )}
        </View>
      )}

      {/* np_address: місто + вулиця + будинок + вартість */}
      {data.method === 'np_address' && (
        <View style={styles.fields}>
          <Text style={styles.fieldLabel}>
            {language === 'ru' ? 'Город' : 'Місто'}
          </Text>
          <NPCitySearch
            value={data.city}
            cityRef={data.cityRef}
            onSelect={(city) =>
              onChange({
                ...data,
                city: city.name,
                cityRef: city.ref,
                deliveryCityRef: city.deliveryCityRef ?? '',
                street: '',
                streetRef: '',
              })
            }
            onClear={clearCity}
          />
          <Text style={styles.fieldLabel}>
            {language === 'ru' ? 'Улица' : 'Вулиця'}
          </Text>
          <NPStreetSearch
            cityRef={data.cityRef}
            value={data.street}
            onSelect={(s) => onChange({ ...data, street: s.name, streetRef: s.ref })}
            onClear={() => onChange({ ...data, street: '', streetRef: '' })}
          />
          <Input
            label={language === 'ru' ? 'Дом / квартира' : 'Будинок / квартира'}
            value={data.house}
            onChangeText={(house) => onChange({ ...data, house })}
            placeholder="1А, кв. 5"
          />
          {data.cityRef && (
            <NPDeliveryCost
              cityRef={data.deliveryCityRef || data.cityRef}
              weight={totalWeight || 1}
              cost={total}
              serviceType="WarehouseDoors"
            />
          )}
        </View>
      )}

      {/* ukrposhta: місто + адреса */}
      {data.method === 'ukrposhta' && (
        <View style={styles.fields}>
          <Text style={styles.fieldLabel}>
            {language === 'ru' ? 'Город' : 'Місто'}
          </Text>
          <NPCitySearch
            value={data.city}
            cityRef={data.cityRef}
            onSelect={(city) =>
              onChange({ ...data, city: city.name, cityRef: city.ref, deliveryCityRef: city.deliveryCityRef ?? '' })
            }
            onClear={clearCity}
          />
          <Input
            label={language === 'ru' ? 'Адрес (отделение Укрпочты)' : 'Адреса (відділення Укрпошти)'}
            value={data.address}
            onChangeText={(address) => onChange({ ...data, address })}
            placeholder={language === 'ru' ? 'ул. Примерная, 1' : 'вул. Прикладна, 1'}
          />
        </View>
      )}

      {/* pickup: інфо про самовивіз */}
      {data.method === 'pickup' && (
        <View style={styles.pickupCard}>
          <Text style={styles.pickupTitle}>
            {language === 'ru' ? '📍 Адрес самовывоза' : '📍 Адреса самовивозу'}
          </Text>
          <Text style={styles.pickupAddress}>
            Грецька площа 3/4, ТЦ Афіна, 4 поверх, Одеса
          </Text>
          <Text style={styles.pickupScheduleTitle}>
            {language === 'ru' ? 'Режим работы:' : 'Графік роботи:'}
          </Text>
          <Text style={styles.pickupSchedule}>
            {language === 'ru'
              ? 'Пн–Пт: 10:00–19:00\nСб: 10:00–17:00\nВс: выходной'
              : 'Пн–Пт: 10:00–19:00\nСб: 10:00–17:00\nНд: вихідний'}
          </Text>
        </View>
      )}

      {/* np_intl / ukrposhta_intl: країна + місто + адреса + індекс */}
      {isIntl && (
        <View style={styles.fields}>
          <Text style={styles.fieldLabel}>
            {language === 'ru' ? 'Страна' : 'Країна'}
          </Text>
          <CountryPicker
            value={data.country}
            onSelect={(country) => onChange({ ...data, country })}
            language={language}
          />
          <Input
            label={language === 'ru' ? 'Город' : 'Місто'}
            value={data.intlCity}
            onChangeText={(intlCity) => onChange({ ...data, intlCity })}
          />
          <Input
            label={language === 'ru' ? 'Адрес' : 'Адреса'}
            value={data.intlAddress}
            onChangeText={(intlAddress) => onChange({ ...data, intlAddress })}
          />
          <Input
            label={language === 'ru' ? 'Почтовый индекс' : 'Поштовий індекс'}
            value={data.intlPostcode}
            onChangeText={(intlPostcode) => onChange({ ...data, intlPostcode })}
            keyboardType="numeric"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    fontSize: fontSizes.lg,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  methodCardActive: {
    borderColor: colors.coral,
    backgroundColor: '#FFF5F5',
  },
  methodIcon: {
    fontSize: 20,
  },
  methodName: {
    flex: 1,
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Medium',
    color: colors.dark,
  },
  methodNameActive: {
    color: colors.coral,
  },
  fields: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.darkSecondary,
    marginBottom: -spacing.xs,
  },
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
  pickupCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: colors.coral,
    gap: spacing.sm,
  },
  pickupTitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
  },
  pickupAddress: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
  },
  pickupScheduleTitle: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
    marginTop: spacing.sm,
  },
  pickupSchedule: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    lineHeight: 20,
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
  countryItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  countryItemActive: {
    backgroundColor: '#FFF5F5',
  },
  countryName: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.dark,
  },
  countryNameActive: {
    fontFamily: 'Inter-SemiBold',
    color: colors.coral,
  },
});
