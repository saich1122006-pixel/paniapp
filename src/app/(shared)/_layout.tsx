// ============================================================================
// Shared Layout
// Stack navigator for shared screens (Terms, Privacy, etc.)
// ============================================================================

import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function SharedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="terms-of-service" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="support" />
    </Stack>
  );
}
