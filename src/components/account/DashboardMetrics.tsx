import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useDerivedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, shadows, borderRadius } from '@/theme';

interface MetricProps {
  label: string;
  value: number;
  suffix?: string;
  color?: string;
  delay?: number;
}

/* ── Animated counter ── */
function AnimatedMetric({ label, value, suffix = '', color = colors.dark, delay = 0 }: MetricProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = withTiming(1, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [value]);

  const displayValue = useDerivedValue(() => {
    return Math.round(progress.value * value);
  });

  // Since we can't use animatedProps on Text directly in all RN versions,
  // use a simple approach with state
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    let frame: number;
    const startTime = Date.now();
    const duration = 1200;
    const startDelay = delay;

    const animate = () => {
      const elapsed = Date.now() - startTime - startDelay;
      if (elapsed < 0) {
        frame = requestAnimationFrame(animate);
        return;
      }
      const t = Math.min(elapsed / duration, 1);
      // Cubic ease out
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, delay]);

  const formattedValue = suffix === '₴'
    ? display.toLocaleString('uk-UA')
    : display.toString();

  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>
        {formattedValue}{suffix && <Text style={styles.metricSuffix}> {suffix}</Text>}
      </Text>
    </View>
  );
}

/* ── Mini bar chart ── */
function MiniChart({ data }: { data: number[] }) {
  const maxVal = Math.max(...data, 1);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Замовлення за місяць</Text>
      <View style={styles.chartBars}>
        {data.map((val, i) => (
          <View key={i} style={styles.barColumn}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: `${(val / maxVal) * 100}%`,
                    backgroundColor: val > 0 ? colors.coral : colors.borderLight,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ── Dashboard metrics grid ── */
interface DashboardMetricsProps {
  ordersCount: number;
  totalSpent: number;
  bonusPoints: number;
  balance: number;
  monthlyOrders?: number[];
}

export function DashboardMetrics({
  ordersCount,
  totalSpent,
  bonusPoints,
  balance,
  monthlyOrders,
}: DashboardMetricsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.metricsGrid}>
        <AnimatedMetric
          label="Замовлень"
          value={ordersCount}
          color={colors.violet}
          delay={0}
        />
        <AnimatedMetric
          label="Загальна сума"
          value={totalSpent}
          suffix="₴"
          color={colors.dark}
          delay={150}
        />
        <AnimatedMetric
          label="Бонуси"
          value={bonusPoints}
          color={colors.coral}
          delay={300}
        />
        <AnimatedMetric
          label="Баланс"
          value={balance}
          suffix="₴"
          color={balance >= 0 ? '#22c55e' : colors.red}
          delay={450}
        />
      </View>

      {monthlyOrders && monthlyOrders.length > 0 && (
        <MiniChart data={monthlyOrders} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: colors.darkTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: 'JetBrainsMono-Bold',
    color: colors.dark,
  },
  metricSuffix: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  chartTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: colors.darkSecondary,
    marginBottom: spacing.sm,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 3,
  },
  barColumn: {
    flex: 1,
  },
  barTrack: {
    height: 60,
    justifyContent: 'flex-end',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    borderRadius: 3,
    minHeight: 3,
  },
});
