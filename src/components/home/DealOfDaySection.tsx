import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { colors, spacing } from '@/theme';
import { ProductCard } from '@/components/product/ProductCard';
import { useLanguage } from '@/hooks/useLanguage';

function useCountdown(endAt: string) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    function update() {
      const diff = new Date(endAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('00:00:00'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endAt]);
  return timeLeft;
}

export function DealOfDaySection({ deal }: { deal: { end_at: string; products: any[] } }) {
  const { language } = useLanguage();
  const countdown = useCountdown(deal.end_at);
  if (!deal.products.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Zap size={18} color={colors.coral} fill={colors.coral} />
          <Text style={styles.title}>
            {language === 'ru' ? 'Молниеносные предложения' : 'Блискавичні пропозиції'}
          </Text>
        </View>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{countdown}</Text>
        </View>
      </View>
      <FlatList
        data={deal.products}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} compact />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 16, fontFamily: 'Unbounded-Bold', color: colors.dark },
  timerBadge: {
    backgroundColor: colors.coral,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timerText: { fontSize: 14, fontFamily: 'JetBrainsMono-Bold', color: '#FFFFFF' },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
});
