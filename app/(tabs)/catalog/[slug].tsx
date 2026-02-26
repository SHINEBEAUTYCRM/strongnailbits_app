import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function CatalogSlugScreen() {
  const { slug } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 20 }}>Catalog: {slug} - Minimal</Text>
    </View>
  );
}
