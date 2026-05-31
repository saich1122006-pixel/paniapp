// ============================================================================
// Index Screen
// Entry point — redirects immediately based on auth state
// ============================================================================

import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function IndexScreen() {
  const { authState, profile } = useAuth();

  if (authState === 'loading') {
    return <LoadingSpinner fullScreen message="Loading PaniApp..." />;
  }

  if (authState === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  if (authState === 'needs_onboarding') {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (profile?.role === 'recruiter') {
    return <Redirect href="/(recruiter)/home" />;
  }

  return <Redirect href="/(worker)/home" />;
}
