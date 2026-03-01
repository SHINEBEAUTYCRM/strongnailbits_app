import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, shadows } from '@/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

/* ── Shimmer overlay ── */
function Shimmer({ width, height }: { width: number; height: number }) {
  const x = useSharedValue(-1);

  useEffect(() => {
    x.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(x.value, [-1, 1], [-width, width]) }],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <Animated.View style={[{ width, height }, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ width, height }}
        />
      </Animated.View>
    </View>
  );
}

/* ── Base skeleton block ── */
interface SkeletonBoxProps {
  width: number | string;
  height: number;
  radius?: number;
  style?: object;
}

export function SkeletonBox({ width, height, radius = 8, style }: SkeletonBoxProps) {
  const numWidth = typeof width === 'number' ? width : SCREEN_WIDTH;
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: '#EBEBF0',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Shimmer width={numWidth} height={height} />
    </View>
  );
}

/* ── Text line skeleton ── */
interface SkeletonTextProps {
  width?: number | string;
  lines?: number;
  lineHeight?: number;
}

export function SkeletonText({ width = '100%', lines = 1, lineHeight = 14 }: SkeletonTextProps) {
  return (
    <View style={{ gap: 6 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          width={i === lines - 1 && lines > 1 ? '60%' : width}
          height={lineHeight}
          radius={4}
        />
      ))}
    </View>
  );
}

/* ── Product card skeleton ── */
const GRID_CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / 2;

interface SkeletonCardProps {
  compact?: boolean;
}

export function SkeletonCard({ compact }: SkeletonCardProps) {
  const cardWidth = compact ? 160 : GRID_CARD_WIDTH;

  return (
    <View style={[skeletonStyles.card, shadows.sm, { width: cardWidth }]}>
      {/* Image area */}
      <SkeletonBox width={cardWidth} height={cardWidth} radius={0} />

      {/* Info area */}
      <View style={skeletonStyles.info}>
        {/* Brand */}
        <SkeletonBox width={50} height={14} radius={4} />
        {/* Name */}
        <SkeletonText lines={2} lineHeight={13} />
        {/* Stock */}
        <SkeletonBox width={70} height={12} radius={4} />
        {/* Price */}
        <SkeletonBox width={80} height={16} radius={4} />
        {/* Button */}
        <SkeletonBox width="100%" height={34} radius={8} />
      </View>
    </View>
  );
}

/* ── Product grid skeleton (2-col) ── */
interface SkeletonGridProps {
  count?: number;
}

export function SkeletonGrid({ count = 4 }: SkeletonGridProps) {
  return (
    <View style={skeletonStyles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={skeletonStyles.gridItem}>
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}

/* ── Horizontal section skeleton ── */
export function SkeletonSection() {
  return (
    <View style={skeletonStyles.section}>
      <View style={skeletonStyles.sectionHeader}>
        <SkeletonBox width={140} height={20} radius={6} />
        <SkeletonBox width={80} height={16} radius={4} />
      </View>
      <View style={skeletonStyles.sectionList}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} compact />
        ))}
      </View>
    </View>
  );
}

/* ── Banner skeleton ── */
export function SkeletonBanner() {
  const bannerWidth = SCREEN_WIDTH - spacing.lg * 2;
  const bannerHeight = bannerWidth * 0.45;

  return (
    <View style={{ paddingHorizontal: spacing.lg }}>
      <SkeletonBox width={bannerWidth} height={bannerHeight} radius={12} />
      {/* Dots */}
      <View style={skeletonStyles.dots}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBox
            key={i}
            width={i === 0 ? 24 : 8}
            height={8}
            radius={4}
          />
        ))}
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  info: {
    padding: 10,
    gap: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
  },
  gridItem: {
    width: '50%',
    padding: spacing.sm / 2,
  },
  section: {
    paddingVertical: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionList: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
});
