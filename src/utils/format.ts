/**
 * Format price in UAH format: 1 234.00 ₴
 */
export function formatPrice(price: number): string {
  return (
    price
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₴'
  );
}

/**
 * Calculate and format discount percentage
 */
export function formatDiscount(price: number, oldPrice: number): string {
  if (!oldPrice || oldPrice <= price) return '';
  const discount = Math.round(((oldPrice - price) / oldPrice) * 100);
  return `-${discount}%`;
}

/**
 * Get product word form based on count (Ukrainian)
 * 1 товар, 2-4 товари, 5-20 товарів
 */
export function getProductWord(count: number, lang: 'uk' | 'ru' = 'uk'): string {
  const abs = Math.abs(count) % 100;
  const lastDigit = abs % 10;

  if (lang === 'ru') {
    if (abs > 10 && abs < 20) return 'товаров';
    if (lastDigit === 1) return 'товар';
    if (lastDigit >= 2 && lastDigit <= 4) return 'товара';
    return 'товаров';
  }

  // Ukrainian
  if (abs > 10 && abs < 20) return 'товарів';
  if (lastDigit === 1) return 'товар';
  if (lastDigit >= 2 && lastDigit <= 4) return 'товари';
  return 'товарів';
}

/**
 * Format weight in kg
 */
export function formatWeight(weight: number): string {
  if (weight < 1) {
    return `${Math.round(weight * 1000)} г`;
  }
  return `${weight.toFixed(2)} кг`;
}

/**
 * Format date to Ukrainian locale
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
