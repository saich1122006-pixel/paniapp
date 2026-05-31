// ============================================================================
// Login Screen
// Phone number input with country code, clean gradient background
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { sendOtp } from '@/services/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Colors, Spacing, Typography, BorderRadius, APP_CONFIG } from '@/constants/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidPhone = phone.replace(/\D/g, '').length === APP_CONFIG.PHONE_LENGTH;

  const handleSendOtp = async () => {
    if (!isValidPhone) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    const fullPhone = `${APP_CONFIG.COUNTRY_CODE}${phone.replace(/\D/g, '')}`;
    const result = await sendOtp(fullPhone);

    setLoading(false);

    if (result.success) {
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { phone: fullPhone },
      });
    } else {
      setError(result.error || 'Failed to send OTP');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top gradient section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.appName}>PaniApp</Text>
          <Text style={styles.tagline}>Find work. Find workers.{'\n'}Right where you are.</Text>
        </View>

        {/* Decorative circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      {/* Form section */}
      <KeyboardAvoidingView
        style={styles.formSection}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.formTitle}>{t('auth.login_title')}</Text>
          <Text style={styles.formSubtitle}>
            {t('auth.login_subtitle')}
          </Text>

          <View style={styles.phoneInputRow}>
            {/* Country Code */}
            <View style={styles.countryCode}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.countryCodeText}>{APP_CONFIG.COUNTRY_CODE}</Text>
            </View>

            {/* Phone Input */}
            <View style={styles.phoneInputWrapper}>
              <Input
                placeholder={t('auth.phone_placeholder')}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text.replace(/\D/g, '').slice(0, 10));
                  setError('');
                }}
                keyboardType="phone-pad"
                maxLength={10}
                error={error}
                size="lg"
              />
            </View>
          </View>

          <Button
            title={t('auth.continue')}
            onPress={handleSendOtp}
            loading={loading}
            disabled={!isValidPhone}
            size="lg"
          />

          <Text style={styles.disclaimer}>
            By continuing, you agree to our{' '}
            <Text 
              style={styles.link}
              onPress={() => router.push('/(shared)/terms-of-service')}
            >
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text 
              style={styles.link}
              onPress={() => router.push('/(shared)/privacy-policy')}
            >
              Privacy Policy
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.primary[700],
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: Spacing['2xl'],
    borderBottomLeftRadius: BorderRadius['3xl'],
    borderBottomRightRadius: BorderRadius['3xl'],
    overflow: 'hidden',
    position: 'relative',
  },
  headerContent: {
    zIndex: 2,
  },
  appName: {
    fontSize: Typography.size['3xl'],
    fontWeight: '900',
    color: Colors.neutral[0],
    letterSpacing: Typography.letterSpacing.tight,
  },
  tagline: {
    fontSize: Typography.size.md,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.sm,
    lineHeight: Typography.lineHeight.md,
    fontWeight: '500',
  },

  // Decorative circles
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -40,
    right: -60,
  },
  circle2: {
    width: 120,
    height: 120,
    bottom: -20,
    right: 40,
  },
  circle3: {
    width: 80,
    height: 80,
    top: 30,
    right: 120,
  },

  // Form
  formSection: {
    flex: 1,
  },
  formContent: {
    padding: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
  },
  formTitle: {
    fontSize: Typography.size.xl,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    fontSize: Typography.size.base,
    color: Colors.light.textSecondary,
    marginBottom: Spacing['3xl'],
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    borderWidth: 1.5,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 60,
    gap: Spacing.xs,
  },
  flag: {
    fontSize: 20,
  },
  countryCodeText: {
    fontSize: Typography.size.base,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  phoneInputWrapper: {
    flex: 1,
  },
  disclaimer: {
    marginTop: Spacing['2xl'],
    fontSize: Typography.size.xs,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.sm,
  },
  link: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
});
