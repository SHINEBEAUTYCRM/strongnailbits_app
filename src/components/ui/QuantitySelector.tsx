import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';
import { colors, fontSizes, borderRadius, spacing } from '@/theme';

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md';
}

export function QuantitySelector({
  value,
  min = 1,
  max,
  onChange,
  size = 'md',
}: QuantitySelectorProps) {
  const iconSize = size === 'sm' ? 14 : 18;
  const isMin = value <= min;
  const isMax = value >= max;

  const handleDecrease = () => {
    if (isMin) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(value - 1);
  };

  const handleIncrease = () => {
    if (isMax) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(value + 1);
  };

  return (
    <View style={[styles.container, size === 'sm' ? styles.containerSm : styles.containerMd]}>
      <TouchableOpacity
        style={[styles.button, isMin && styles.buttonDisabled]}
        onPress={handleDecrease}
        disabled={isMin}
        activeOpacity={0.6}
      >
        <Minus size={iconSize} color={isMin ? colors.darkTertiary : colors.dark} />
      </TouchableOpacity>
      <Text style={[styles.value, size === 'sm' && styles.valueSm]}>{value}</Text>
      <TouchableOpacity
        style={[styles.button, isMax && styles.buttonDisabled]}
        onPress={handleIncrease}
        disabled={isMax}
        activeOpacity={0.6}
      >
        <Plus size={iconSize} color={isMax ? colors.darkTertiary : colors.dark} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sand,
    borderRadius: borderRadius.md,
  },
  containerSm: {
    height: 32,
  },
  containerMd: {
    height: 40,
  },
  button: {
    width: 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  value: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: fontSizes.md,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark,
  },
  valueSm: {
    fontSize: fontSizes.sm,
    minWidth: 24,
  },
});
