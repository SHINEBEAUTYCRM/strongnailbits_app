import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

import React, { useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { useAuthStore } from '@/stores/auth';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useCartSync } from '@/hooks/useCartSync';
import { useWishlistSync } from '@/hooks/useWishlistSync';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { colors } from '@/theme';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

function AndroidBackHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const lastBackPress = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const ROOT_TABS = ['/', '/catalog', '/cart', '/wishlist', '/account'];
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      const isRootTab = ROOT_TABS.some(
        (tab) => pathname === tab || pathname === tab + '/'
      );

      if (isRootTab) {
        const now = Date.now();
        if (now - lastBackPress.current < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastBackPress.current = now;
        showToast('Натисніть ще раз, щоб вийти', 'info');
        return true;
      }

      router.back();
      return true;
    });

    return () => handler.remove();
  }, [pathname]);

  return null;
}

function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    async function load() {
      try {
        // Load fonts
        await Font.loadAsync({
          'Unbounded-Medium': require('../assets/fonts/Unbounded-Medium.ttf'),
          'Unbounded-Bold': require('../assets/fonts/Unbounded-Bold.ttf'),
          'Unbounded-Black': require('../assets/fonts/Unbounded-Black.ttf'),
          'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
          'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
          'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
          'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
          'JetBrainsMono-Regular': require('../assets/fonts/JetBrainsMono-Regular.ttf'),
          'JetBrainsMono-Medium': require('../assets/fonts/JetBrainsMono-Medium.ttf'),
          'JetBrainsMono-Bold': require('../assets/fonts/JetBrainsMono-Bold.ttf'),
        });
        setFontsLoaded(true);

        // Initialize auth
        await initialize();
      } catch (error) {
        console.error('Failed to load resources:', error);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    load();
  }, []);

  // Realtime subscriptions
  useRealtimeSync();

  // Sync cart with Supabase
  useCartSync();

  // Sync wishlist with Supabase
  useWishlistSync();

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ToastProvider>
            <AndroidBackHandler />
            <OfflineBanner />
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.pearl },
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                fullScreenGestureEnabled: true,
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="(auth)"
                options={{ headerShown: false, presentation: 'modal' }}
              />
              <Stack.Screen name="product/[slug]" />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="search" options={{ presentation: 'modal' }} />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="brands" />
              <Stack.Screen name="page/[slug]" />
            </Stack>
          </ToastProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
