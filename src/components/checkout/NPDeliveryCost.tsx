import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Truck } from 'lucide-react-native';
import { colors, fontSizes, spacing, borderRadius } from '@/theme';
import { calculateDelivery } from '@/lib/novaposhta/api';

interface NPDeliveryCostProps {
  cityRef: string;
  weight: number;
  cost: number;
  serviceType?: string;
}

export function NPDeliveryCost({ cityRef, weight, cost, serviceType }: NPDeliveryCostProps) {
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null);
  const [estimatedDays, setEstimatedDays] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!cityRef || !weight || !cost) {
      setDeliveryCost(null);
      setEstimatedDays(null);
      return;
    }

    setLoading(true);
    setFailed(false);

    calculateDelivery({ cityRef, weight, cost, serviceType })
      .then((result) => {
        if (result) {
          setDeliveryCost(result.cost);
          setEstimatedDays(result.estimatedDays);
        } else {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [cityRef, weight, cost, serviceType]);

  if (!cityRef) return null;

  return (
    <View style={styles.container}>
      <Truck size={16} color={colors.coral} />
      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={colors.coral} />
          <Text style={styles.label}>Розрахунок вартості доставки...</Text>
        </View>
      ) : failed || deliveryCost === null ? (
        <Text style={styles.fallback}>
          Вартість розраховується при обробці замовлення
        </Text>
      ) : (
        <View style={styles.row}>
          <Text style={styles.label}>Доставка:</Text>
          <Text style={styles.cost}>
            {deliveryCost === 0 ? 'Безкоштовно' : `~${deliveryCost} грн`}
          </Text>
          {estimatedDays && (
            <Text style={styles.days}>· {estimatedDays}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: colors.coral,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
  },
  cost: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
  },
  days: {
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkTertiary,
  },
  fallback: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
  },
});
