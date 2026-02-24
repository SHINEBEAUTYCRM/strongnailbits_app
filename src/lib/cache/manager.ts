import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cache manager for API data with TTL (async).
 */
export class CacheManager {
  static async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    try {
      const entry = {
        data,
        expiresAt: Date.now() + ttlMs,
      };
      await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (e) {
      console.warn('[CacheManager] set failed:', key, e);
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(`cache:${key}`);
      if (!raw) return null;

      const entry = JSON.parse(raw) as { data: T; expiresAt: number };
      if (Date.now() > entry.expiresAt) {
        await AsyncStorage.removeItem(`cache:${key}`).catch(() => {});
        return null;
      }
      return entry.data;
    } catch {
      await AsyncStorage.removeItem(`cache:${key}`).catch(() => {});
      return null;
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`cache:${key}`);
    } catch (e) {
      console.warn('[CacheManager] remove failed:', key, e);
    }
  }

  static async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith('cache:'));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (e) {
      console.warn('[CacheManager] clearAll failed:', e);
    }
  }
}

export const CACHE_TTL = {
  categories: 5 * 60 * 1000,
  brands: 60 * 60 * 1000,
  productList: 2 * 60 * 1000,
  productDetail: 5 * 60 * 1000,
  appConfig: 10 * 60 * 1000,
} as const;
