// ============================================================================
// Root Layout
// Auth guard that redirects based on authentication state and user role
// ============================================================================

import React, { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/theme';
import '@/i18n';

// ─── Error Boundary ─────────────────────────────────────────────────────
// Catches JS errors that would otherwise crash the app (open and close)
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.emoji}>😔</Text>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            style={errorStyles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={errorStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 32,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.light.textPrimary, marginBottom: 8 },
  message: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', marginBottom: 24 },
  button: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

// ─── Auth Guard ─────────────────────────────────────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authState, profile, hasSelectedLanguage } = useAuth();
  const rawSegments = useSegments();
  const segments = (rawSegments || []) as string[];

  useEffect(() => {
    if (authState === 'loading' || hasSelectedLanguage === null) return;

    // Check if the user is already on a dashboard screen to prevent redirect loops.
    // This is robust against compiler variations where Expo Router includes or omits parenthesis groups in segments.
    const isDashboard = segments.some(seg => 
      ['home', 'my-jobs', 'find-workers', 'profile', '(worker)', '(recruiter)'].includes(seg)
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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

