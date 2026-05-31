// ============================================================================
// Language Selection Screen
// Allows user to choose app language, updating i18n and user profile.
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { updateProfile } from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGES = [
  { code: 'en', labelKey: 'language.english', nativeName: 'English' },
  { code: 'hi', labelKey: 'language.hindi', nativeName: 'हिंदी' },
  { code: 'te', labelKey: 'language.telugu', nativeName: 'తెలుగు' },
];

export default function LanguageSelectionScreen() {
  const { t, i18n } = useTranslation();
  const { authState, profile, setHasSelectedLanguage } = useAuth();
  const params = useLocalSearchParams<{
    phone?: string;
    userId?: string;
    isNewUser?: string;
  }>();

  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    try {
      setLoading(true);
      await i18n.changeLanguage(selectedLang);
      
      // Save to AsyncStorage so AuthGuard knows the user has picked a language
      try {
        await AsyncStorage.setItem('has_selected_language', 'true');
      } catch (e) {
        console.warn('AsyncStorage failed, proceeding in-memory', e);
      }
      
      if (profile) {
        await updateProfile(profile.id, { app_language: selectedLang });
      }
      
      setHasSelectedLanguage(true);

      // Navigate based on auth state
      if (authState === 'authenticated') {
        if (profile?.role === 'worker') {
          router.replace('/(worker)/home');
        } else {
          router.replace('/(recruiter)/home');
        }
      } else if (authState === 'needs_onboarding') {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Error in language selection:', error);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>🌐</Text>
          <Text style={styles.title}>{t('language.title')}</Text>
          <Text style={styles.subtitle}>{t('language.subtitle')}</Text>
        </View>

        <View style={styles.languageList}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageCard,
                selectedLang === lang.code && styles.languageCardSelected,
              ]}
              onPress={() => setSelectedLang(lang.code)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.languageText,
                  selectedLang === lang.code && styles.languageTextSelected,
                ]}
              >
                {t(lang.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Button
            title={t('language.continue')}
            onPress={handleContinue}
            loading={loading}
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  icon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: '700',
    color: Colors.light.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.base,
  },
  languageList: {
    flex: 1,
    gap: Spacing.md,
    justifyContent: 'center',
  },
  languageCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[0],
    alignItems: 'center',
  },
  languageCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  languageText: {
    fontSize: Typography.size.lg,
    fontWeight: '600',
    color: Colors.neutral[700],
  },
  languageTextSelected: {
    color: Colors.primary[700],
    fontWeight: '700',
  },
  footer: {
    paddingBottom: Spacing['2xl'],
  },
});
