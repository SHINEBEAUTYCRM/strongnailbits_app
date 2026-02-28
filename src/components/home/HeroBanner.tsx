import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { colors, borderRadius, spacing } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const BANNER_HEIGHT = BANNER_WIDTH * 0.45;

interface Banner {
  id: string;
  image_desktop: string;
  image_mobile?: string;
  button_url?: string;
}

function webUrlToAppRoute(url: string): string | null {
  if (!url) return null;
  try {
    let path = url;
    if (url.startsWith('http')) {
      const parsed = new URL(url);
      path = parsed.pathname;
    }
    path = path.replace(/\/$/, '');

    if (path.startsWith('/catalog/')) {
      const slug = path.replace('/catalog/', '');
      return `/(tabs)/catalog/${slug}`;
    }
    if (path.startsWith('/product/')) {
      const slug = path.replace('/product/', '');
      return `/product/${slug}`;
    }
    if (path.startsWith('/brands/')) {
      const slug = path.replace('/brands/', '');
      return `/brands?brand=${slug}`;
    }
    if (path === '/catalog') {
      return '/(tabs)/catalog';
    }
    return null;
  } catch {
    return null;
  }
}

interface HeroBannerProps {
  banners: Banner[];
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              if (item.button_url) {
                const appRoute = webUrlToAppRoute(item.button_url);
                if (appRoute) {
                  router.push(appRoute as never);
                } else {
                  Linking.openURL(item.button_url);
                }
              }
            }}
          >
            <Image
              source={{ uri: item.image_mobile ?? item.image_desktop }}
              style={styles.banner}
              contentFit="cover"
              transition={300}
            />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, index) => ({
          length: BANNER_WIDTH,
          offset: BANNER_WIDTH * index,
          index,
        })}
      />
      {banners.length > 1 && (
        <View style={styles.indicators}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === activeIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  banner: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 12,
    backgroundColor: colors.sand,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  indicatorActive: {
    backgroundColor: colors.coral,
    width: 24,
  },
});
