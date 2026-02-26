import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

import { Slot } from 'expo-router';
import { View, Text } from 'react-native';

function RootLayout() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24 }}>ShineShop Works!</Text>
      <Slot />
    </View>
  );
}

export default Sentry.wrap(RootLayout);
