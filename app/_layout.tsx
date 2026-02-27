import * as Sentry from '@sentry/react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { FlashList } from '@shopify/flash-list';
import Svg, { Circle } from 'react-native-svg';
import Share from 'react-native-share';
import { View, Text } from 'react-native';
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

function RootLayout() {
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    try {
      const modules = [
        FlashList ? 'FlashList' : null,
        Svg ? 'SVG' : null,
        Share ? 'Share' : null,
      ].filter(Boolean);
      setStatus(`Step 3 OK! Modules: ${modules.join(', ')}`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
      Sentry.captureException(e);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 20 }}>{status}</Text>
          <Slot />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
