import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');

const EMOJIS = ['🌸', '🌷', '💮', '✿', '🌺', '🏵️'];
const COUNT = 16;

interface Cfg {
  emoji: string;
  x: number;
  size: number;
  dur: number;
  del: number;
  drift: number;
  rot: number;
  alpha: number;
}

function Petal({ c }: { c: Cfg }) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      c.del,
      withRepeat(withTiming(1, { duration: c.dur, easing: Easing.linear }), -1, false),
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const ty = interpolate(p.value, [0, 1], [-60, SH + 60]);
    const tx = c.drift * Math.sin(p.value * Math.PI * 2.5);
    const rz = interpolate(p.value, [0, 1], [0, c.rot]);
    return {
      transform: [{ translateY: ty }, { translateX: tx }, { rotate: `${rz}deg` }],
      opacity: c.alpha,
    };
  });

  return (
    <Animated.View style={[styles.petal, { left: c.x }, style]}>
      <Text style={{ fontSize: c.size }}>{c.emoji}</Text>
    </Animated.View>
  );
}

export function FloatingPetals() {
  const petals = useMemo<Cfg[]>(
    () =>
      Array.from({ length: COUNT }, () => ({
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        x: Math.random() * (SW - 28),
        size: 14 + Math.random() * 16,
        dur: 7000 + Math.random() * 9000,
        del: Math.random() * 6000,
        drift: 12 + Math.random() * 22,
        rot: 180 + Math.random() * 540,
        alpha: 0.22 + Math.random() * 0.38,
      })),
    [],
  );

  return (
    <Animated.View style={styles.container} pointerEvents="none">
      {petals.map((c, i) => (
        <Petal key={i} c={c} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    overflow: 'hidden',
  },
  petal: {
    position: 'absolute',
    top: 0,
  },
});
