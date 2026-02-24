import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors, fontSizes, spacing } from '@/theme';

export function OfflineBanner() {
  const isConnected = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (isConnected) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xs }]}>
      <WifiOff size={16} color="#fff" />
      <Text style={styles.text}>Немає з'єднання з інтернетом</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    zIndex: 10000,
  },
  text: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
  },
});
