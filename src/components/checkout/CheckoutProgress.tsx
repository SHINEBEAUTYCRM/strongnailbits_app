import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { User, Truck, CreditCard, Check } from 'lucide-react-native';
import { colors, spacing } from '@/theme';

interface CheckoutProgressProps {
  currentStep: number;
  totalSteps: number;
}

const STEPS = [
  { icon: User, label: 'Контакт' },
  { icon: Truck, label: 'Доставка' },
  { icon: CreditCard, label: 'Оплата' },
];

function StepDot({
  index,
  current,
  icon: Icon,
  label,
}: {
  index: number;
  current: number;
  icon: typeof User;
  label: string;
}) {
  const isActive = index === current;
  const isCompleted = index < current;

  return (
    <View style={styles.stepItem}>
      <Animated.View
        style={[
          styles.dot,
          isActive && styles.dotActive,
          isCompleted && styles.dotCompleted,
        ]}
      >
        {isCompleted ? (
          <Check size={14} color="#FFFFFF" />
        ) : (
          <Icon
            size={14}
            color={isActive ? '#FFFFFF' : colors.darkTertiary}
          />
        )}
      </Animated.View>
      <Text
        style={[
          styles.stepLabel,
          isActive && styles.stepLabelActive,
          isCompleted && styles.stepLabelCompleted,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function CheckoutProgress({ currentStep, totalSteps }: CheckoutProgressProps) {
  const progress = currentStep / (totalSteps - 1);

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STEPS.map((step, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <View style={styles.lineTrack}>
                <Animated.View
                  style={[
                    styles.lineFill,
                    {
                      width: i <= currentStep ? '100%' : '0%',
                    },
                  ]}
                />
              </View>
            )}
            <StepDot index={i} current={currentStep} {...step} />
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: colors.coral,
  },
  dotCompleted: {
    backgroundColor: '#22c55e',
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: colors.darkTertiary,
  },
  stepLabelActive: {
    color: colors.coral,
    fontFamily: 'Inter-SemiBold',
  },
  stepLabelCompleted: {
    color: '#22c55e',
  },
  lineTrack: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderLight,
    marginHorizontal: 4,
    marginBottom: 18, // offset for label
    borderRadius: 1,
    overflow: 'hidden',
  },
  lineFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 1,
  },
});
