import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme';

interface PromoStripProps {
  banner: {
    heading?: string;
    title?: string;
    bg_color?: string;
    text_color?: string;
  };
}

export function PromoStrip({ banner }: PromoStripProps) {
  if (!banner.heading && !banner.title) return null;
  return (
    <View style={[styles.container, { backgroundColor: banner.bg_color || colors.coral }]}>
      <Text style={[styles.text, { color: banner.text_color || '#FFFFFF' }]}>
        {banner.heading || banner.title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
});
