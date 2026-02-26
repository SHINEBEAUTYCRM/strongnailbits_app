import { useCallback } from 'react';
import { useSettingsStore } from '@/stores/settings';

export function useLanguage() {
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const t = useCallback(
    <T extends { name_uk: string; name_ru?: string | null }>(
      item: T
    ): string => {
      if (language === 'ru' && item.name_ru) return item.name_ru;
      return item.name_uk;
    },
    [language]
  );

  const tField = useCallback(
    (uk: string | null | undefined, ru: string | null | undefined): string => {
      if (language === 'ru' && ru) return ru;
      return uk ?? '';
    },
    [language]
  );

  return {
    language,
    setLanguage,
    t,
    tField,
    isUk: language === 'uk',
    isRu: language === 'ru',
  };
}
