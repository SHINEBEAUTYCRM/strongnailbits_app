import { Slot } from 'expo-router';
import { View, Text } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24 }}>ShineShop Works!</Text>
      <Slot />
    </View>
  );
}
