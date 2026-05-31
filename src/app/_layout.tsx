// ============================================================================
// Root Layout
// Auth guard that redirects based on authentication state and user role
// ============================================================================

import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/theme';
import '@/i18n';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authState, profile, hasSelectedLanguage } = useAuth();
  const rawSegments = useSegments();
  const segments = rawSegments as string[];

  useEffect(() => {
    if (authState === 'loading' || hasSelectedLanguage === null) return;

    // Check if the user is already on a dashboard screen to prevent redirect loops.
    // This is robust against compiler variations where Expo Router includes or omits parenthesis groups in segments.
    const isDashboard = segments.some(seg => 
      ['home', 'my-jobs', 'find-workers', 'profile', 'wallet', '(worker)', '(recruiter)'].includes(seg)
    );

    const onOnboarding = segments.includes('onboarding');
    const onLanguageSelection = segments.includes('language-selection');
    const onLogin = segments.includes('login') || segments.includes('verify-otp');
    const onShared = segments.includes('(shared)');

    if (!hasSelectedLanguage) {
      if (!onLanguageSelection && !onShared) {
        router.replace('/(auth)/language-selection');
      }
      return;
    }

    if (authState === 'unauthenticated') {
      // Not signed in — redirect to login
      if (!onLogin && !onLanguageSelection && !onShared) {
        router.replace('/(auth)/login');
      }
    } else if (authState === 'needs_onboarding') {
      // Signed in but no profile — redirect to onboarding
      if (!onOnboarding && !onLanguageSelection && !onShared) {
        router.replace('/(auth)/onboarding');
      }
    } else if (authState === 'authenticated' && profile) {
      // Signed in with profile — redirect to correct home page
      if (!isDashboard && !onLanguageSelection && !onShared) {
        if (profile.role === 'worker') {
          router.replace('/(worker)/home');
        } else {
          router.replace('/(recruiter)/home');
        }
      }
    }
  }, [authState, profile, segments, hasSelectedLanguage]);

  if (authState === 'loading' || hasSelectedLanguage === null) {
    return <LoadingSpinner fullScreen message="Loading PaniApp..." />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AuthGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.light.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(worker)" />
          <Stack.Screen name="(recruiter)" />
          <Stack.Screen name="(shared)" />
        </Stack>
      </AuthGuard>
    </AuthProvider>
  );
}
