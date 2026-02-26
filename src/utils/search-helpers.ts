const cyrToLatMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'ch', ш: 'sh', щ: 'shh', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya', і: 'i', ї: 'yi', є: 'ye', ґ: 'g',
};

const latToCyrMap: Record<string, string> = {
  a: 'а', b: 'б', c: 'ц', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х',
  i: 'и', j: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п',
  q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'кс',
  y: 'у', z: 'з',
};

/**
 * Convert Cyrillic text to Latin transliteration
 */
export function cyrToLat(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((char) => cyrToLatMap[char] || char)
    .join('');
}

/**
 * Convert Latin text to Cyrillic transliteration
 */
export function latToCyr(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((char) => latToCyrMap[char] || char)
    .join('');
}

/**
 * Get all search variants (original + transliterations)
 */
export function getSearchVariants(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const variants = new Set<string>();
  variants.add(trimmed);
  variants.add(cyrToLat(trimmed));
  variants.add(latToCyr(trimmed));

  return Array.from(variants).filter(Boolean);
}
