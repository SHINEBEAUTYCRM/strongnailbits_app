import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '@/theme/colors';

export type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  _hydrated: boolean;
}

const STORAGE_KEY = 'shineshop_theme';

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: 'auto',
  _hydrated: false,
  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  },
}));

// Hydrate on import
AsyncStorage.getItem(STORAGE_KEY)
  .then((v) => {
    if (v === 'light' || v === 'dark' || v === 'auto') {
      useThemeStore.setState({ mode: v, _hydrated: true });
    } else {
      useThemeStore.setState({ _hydrated: true });
    }
  })
  .catch(() => {
    useThemeStore.setState({ _hydrated: true });
  });

export function useTheme() {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);

  const isDark =
    mode === 'dark' || (mode === 'auto' && systemScheme === 'dark');

  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
    mode,
    setMode: useThemeStore.getState().setMode,
  };
}
