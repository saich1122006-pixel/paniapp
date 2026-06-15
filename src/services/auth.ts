// ============================================================================
// Auth Service
// Phone OTP authentication helpers using Supabase Auth
// ============================================================================

import { supabase } from './supabase';

export interface SignInResult {
  success: boolean;
  error?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  userId?: string;
  isNewUser?: boolean;
  error?: string;
}

/**
 * Send OTP to phone number via Supabase Auth.
 * Supabase will route through Twilio/MessageBird (configured in dashboard).
 */
export async function sendOtp(phone: string): Promise<SignInResult> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send OTP' };
  }
}

/**
 * Verify the 6-digit OTP code.
 * On success, the Supabase session is automatically persisted via AsyncStorage.
 */
export async function verifyOtp(
  phone: string,
  token: string
): Promise<VerifyOtpResult> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      return {
        success: true,
        userId: data.user.id,
        isNewUser: !profile,
      };
    }

    return { success: false, error: error?.message || 'Invalid verification code' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to verify OTP' };
  }
}

/**
 * Create a new user profile after onboarding.
 */
export async function createProfile(params: {
  userId: string;
  phone: string;
  fullName: string;
  role: 'worker' | 'recruiter';
  desiredSkills?: string[];
  minWageFloor?: number;
  appLanguage?: string;
  searchRadiusKm?: number;
  pushToken?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    
    if (!currentUser) {
      return { success: false, error: 'User is not authenticated' };
    }

    const finalUserId = currentUser.id;
    const finalPhone = currentUser.phone ? `+${currentUser.phone.replace('+', '')}` : params.phone;

    const { error } = await supabase.from('profiles').upsert({
      id: finalUserId,
      phone_number: finalPhone,
      full_name: params.fullName,
      role: params.role,
      desired_skills: params.desiredSkills || [],
      min_wage_floor: params.minWageFloor || 0,
      app_language: params.appLanguage || 'en',
      search_radius_km: params.searchRadiusKm || 10,
      push_token: params.pushToken || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }

    // Trigger translation asynchronously
    if (params.fullName) {
      supabase.functions.invoke('translate-content', {
        body: {
          table: 'profiles',
          id: finalUserId,
          textFields: { full_name: params.fullName }
        }
      }).catch(console.error);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create profile' };
  }
}

/**
 * Get current user's profile.
 */
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Update user profile fields.
 */
export async function updateProfile(
  userId: string,
  updates: Record<string, any>
) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  // Trigger translation asynchronously if full_name is updated
  if (!error && updates.full_name) {
    supabase.functions.invoke('translate-content', {
      body: {
        table: 'profiles',
        id: userId,
        textFields: { full_name: updates.full_name }
      }
    }).catch(console.error);
  }

  return { success: !error, error: error?.message };
}

/**
 * Sign out the user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { success: !error, error: error?.message };
}

/**
 * Permanently delete the user's account and profile data.
 */
export async function deleteAccount() {
  try {
    const { error } = await supabase.rpc('delete_user');
    if (error) {
      return { success: false, error: error.message };
    }
    await supabase.auth.signOut();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete account' };
  }
}
