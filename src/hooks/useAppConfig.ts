import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { CacheManager, CACHE_TTL } from '@/lib/cache/manager';

interface AppConfig {
  freeShippingThreshold: number;
  minOrderAmount: number;
  phone: string;
  email: string;
  instagram: string;
  telegram: string;
  workingHours: Record<string, string>;
  address: string;
  shippingMethods: Array<{ id: string; name_uk: string; name_ru?: string; icon: string }>;
  paymentMethods: Array<{ id: string; name_uk: string; name_ru?: string }>;
  featureFlags: Record<string, boolean>;
  loyaltyTiers: Record<string, number>;
  maintenanceMode: boolean;
  minAppVersion: string;
}

const DEFAULT_CONFIG: AppConfig = {
  freeShippingThreshold: 2500,
  minOrderAmount: 300,
  phone: '',
  email: '',
  instagram: '',
  telegram: '',
  workingHours: {},
  address: '',
  shippingMethods: [],
  paymentMethods: [],
  featureFlags: {},
  loyaltyTiers: {},
  maintenanceMode: false,
  minAppVersion: '1.0.0',
};

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    const cached = await CacheManager.get<AppConfig>('app_config');
    if (cached) {
      setConfig(cached);
      setIsLoading(false);
      fetchConfig();
      return;
    }

    await fetchConfig();
  }

  async function fetchConfig() {
    try {
      const { data } = await supabase
        .from('app_config')
        .select('key, value');

      if (data) {
        const map: Record<string, unknown> = {};
        data.forEach((row) => {
          map[row.key] = row.value;
        });

        const parsed: AppConfig = {
          freeShippingThreshold: (map.free_shipping_threshold as number) ?? 2500,
          minOrderAmount: (map.min_order_amount as number) ?? 300,
          phone: (map.phone as string) ?? '',
          email: (map.email as string) ?? '',
          instagram: (map.instagram as string) ?? '',
          telegram: (map.telegram_channel as string) ?? '',
          workingHours: (map.working_hours as Record<string, string>) ?? {},
          address: (map.address as string) ?? '',
          shippingMethods: (map.shipping_methods as AppConfig['shippingMethods']) ?? [],
          paymentMethods: (map.payment_methods as AppConfig['paymentMethods']) ?? [],
          featureFlags: (map.feature_flags as Record<string, boolean>) ?? {},
          loyaltyTiers: (map.loyalty_tiers as Record<string, number>) ?? {},
          maintenanceMode: (map.maintenance_mode as boolean) ?? false,
          minAppVersion:
            Platform.OS === 'ios'
              ? (map.min_app_version_ios as string) ?? '1.0.0'
              : (map.min_app_version_android as string) ?? '1.0.0',
        };

        setConfig(parsed);
        await CacheManager.set('app_config', parsed, CACHE_TTL.appConfig);
      }
    } catch (error) {
      console.error('Failed to load app config:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return { ...config, isLoading };
}
