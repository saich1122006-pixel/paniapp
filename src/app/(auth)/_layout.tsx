// ============================================================================
// Auth Layout
// Simple stack navigator for auth flow (login → OTP → onboarding)
// ============================================================================

import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="language-selection" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
