// ============================================================================
// OTP Verification Screen
// 6-digit code input with auto-focus, countdown timer, and resend
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { verifyOtp, sendOtp, updateProfile } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import Button from '@/components/ui/Button';
import { Colors, Spacing, Typography, BorderRadius, APP_CONFIG } from '@/constants/theme';

export default function VerifyOtpScreen() {
  const { t } = useTranslation();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setAuthState } = useAuth();
  const { expoPushToken } = usePushNotifications();

  const [otp, setOtp] = useState<string[]>(new Array(APP_CONFIG.OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState<number>(APP_CONFIG.OTP_RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    setError('');
    const newOtp = [...otp];

    if (value.length > 1) {
      // Handle paste — distribute digits across inputs
      const digits = value.replace(/\D/g, '').split('').slice(0, APP_CONFIG.OTP_LENGTH);
      digits.forEach((digit, i) => {
        if (index + i < APP_CONFIG.OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, APP_CONFIG.OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < APP_CONFIG.OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    // Auto-submit when all digits entered
    const fullOtp = newOtp.join('');
    if (fullOtp.length === APP_CONFIG.OTP_LENGTH && !fullOtp.includes('')) {
      handleVerify(fullOtp);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    if (code.length !== APP_CONFIG.OTP_LENGTH) {
      setError('Please enter the complete OTP');
      return;
    }

    setLoading(true);
    setError('');

    const result = await verifyOtp(phone!, code);
    setLoading(false);

    if (result.success) {
      if (result.isNewUser) {
        router.replace({
          pathname: '/(auth)/onboarding',
          params: { phone: phone!, userId: result.userId, pushToken: expoPushToken?.data },
        });
      } else {
        if (expoPushToken?.data && result.userId) {
          await updateProfile(result.userId, { push_token: expoPushToken.data });
        }
        router.replace('/');
      }
    } else {
      setError(result.error || 'Invalid OTP');
      setOtp(new Array(APP_CONFIG.OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(APP_CONFIG.OTP_RESEND_SECONDS);
    setError('');

    const result = await sendOtp(phone!);
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to resend OTP');
    }
  };

  const maskedPhone = phone
    ? `${phone.slice(0, 4)}****${phone.slice(-2)}`
    : '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.lockIcon}>🔐</Text>
          <Text style={styles.title}>{t('auth.verify_title')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.verify_subtitle')} {'\n'}
            <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
          </Text>
        </View>

        {/* OTP Inputs */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                error && styles.otpInputError,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={index === 0 ? APP_CONFIG.OTP_LENGTH : 1}
              selectTextOnFocus
              selectionColor={Colors.primary[500]}
            />
          ))}
        </View>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        {/* Verify Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={t('auth.verify_btn')}
            onPress={() => handleVerify()}
            loading={loading}
            disabled={otp.join('').length !== APP_CONFIG.OTP_LENGTH}
            size="lg"
          />
        </View>

        {/* Resend */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>{t('auth.resend_prompt')} </Text>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>{t('auth.resend_btn')}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.countdown}>
              {t('auth.resend_wait', { seconds: countdown })}
            </Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 60,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing['2xl'],
  },
  backText: {
    fontSize: Typography.size.base,
    color: Colors.primary[700],
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.base,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },

  // OTP Inputs
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm + 2,
    marginBottom: Spacing.lg,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    fontSize: Typography.size.xl,
    fontWeight: '700',
    color: Colors.neutral[900],
    backgroundColor: Colors.neutral[0],
  },
  otpInputFilled: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  otpInputError: {
    borderColor: Colors.error.main,
    backgroundColor: Colors.error.light,
  },

  error: {
    textAlign: 'center',
    color: Colors.error.main,
    fontSize: Typography.size.sm,
    fontWeight: '500',
    marginBottom: Spacing.lg,
  },

  buttonContainer: {
    marginTop: Spacing.lg,
  },

  // Resend
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
  resendText: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
  },
  resendLink: {
    fontSize: Typography.size.sm,
    color: Colors.primary[700],
    fontWeight: '700',
  },
  countdown: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
    fontWeight: '600',
  },
});
