import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { useAuthStore } from '@/stores/auth';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { colors } from '@/theme';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

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

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ToastProvider>
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
