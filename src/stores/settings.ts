import { create } from 'zustand';

interface SettingsStore {
  language: 'uk' | 'ru';
  pushEnabled: boolean;

  setLanguage: (lang: 'uk' | 'ru') => void;
  setPushEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()((set) => ({
  language: 'uk',
  pushEnabled: true,

  setLanguage: (language) => set({ language }),
  setPushEnabled: (pushEnabled) => set({ pushEnabled }),
}));
