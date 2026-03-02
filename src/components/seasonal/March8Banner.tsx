import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { spacing, borderRadius } from '@/theme';

const CARD_W = Dimensions.get('window').width - spacing.lg * 2;

export function March8Banner() {
  const router = useRouter();

  return (
    <Animated.View entering={FadeInUp.duration(600).springify().damping(14)} style={styles.wrapper}>
      <LinearGradient
        colors={['#FFF0F3', '#FFE0E8', '#FFD1DC', '#FFC4D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative large "8" in background */}
        <Text style={styles.bigEight}>8</Text>

        {/* Scattered flower decorations */}
        <Text style={[styles.deco, styles.decoTR]}>🌸</Text>
        <Text style={[styles.deco, styles.decoBL]}>🌷</Text>
        <Text style={[styles.deco, styles.decoTL]}>💮</Text>
        <Text style={[styles.deco, styles.decoBR]}>🌺</Text>

        <View style={styles.content}>
          <Text style={styles.eyebrow}>8 Березня</Text>
          <Text style={styles.title}>З святом весни! 💐</Text>
          <Text style={styles.subtitle}>
            Даруйте красу та натхнення{'\n'}найближчим та коханим
          </Text>

          <TouchableOpacity
            style={styles.cta}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/catalog')}
          >
            <Text style={styles.ctaText}>Обрати подарунок 🎁</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#D6264A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  gradient: {
    width: CARD_W,
    paddingVertical: 32,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  bigEight: {
    position: 'absolute',
    right: -20,
    top: -30,
    fontSize: 200,
    fontFamily: 'Unbounded-Black',
    color: 'rgba(214, 38, 74, 0.06)',
    lineHeight: 220,
  },
  deco: {
    position: 'absolute',
    fontSize: 22,
    opacity: 0.7,
  },
  decoTR: { top: 14, right: 18 },
  decoBL: { bottom: 18, left: 14 },
  decoTL: { top: 20, left: 20, fontSize: 16, opacity: 0.5 },
  decoBR: { bottom: 14, right: 60, fontSize: 18, opacity: 0.5 },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  eyebrow: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#D6264A',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Unbounded-Black',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#5C2434',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    opacity: 0.85,
  },
  cta: {
    backgroundColor: '#D6264A',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 50,
    shadowColor: '#D6264A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaText: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
