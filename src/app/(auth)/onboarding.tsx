// ============================================================================
// Onboarding Screen
// Role selection (Worker/Recruiter), name input, and skill selection
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { createProfile } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
  SKILL_CATEGORIES,
  APP_CONFIG,
} from '@/constants/theme';

type Step = 'role' | 'details';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { phone, userId, appLanguage, pushToken } = useLocalSearchParams<{
    phone: string;
    userId: string;
    appLanguage?: string;
    pushToken?: string;
  }>();
  const { refreshProfile } = useAuth();

  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<'worker' | 'recruiter' | null>(null);
  const [fullName, setFullName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((s) => s !== skillId)
        : [...prev, skillId]
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkillInput('');
  };

  const handleContinue = () => {
    if (!role) return;
    setStep('details');
  };

  const handleComplete = async () => {
    if (!fullName.trim()) {
      Alert.alert('Name Required', 'Please enter your name');
      return;
    }

    setLoading(true);

    const result = await createProfile({
      userId: userId!,
      phone: phone!,
      fullName: fullName.trim(),
      role: role!,
      desiredSkills: selectedSkills,
      minWageFloor: undefined,
      appLanguage: appLanguage || APP_CONFIG.DEFAULT_LANGUAGE,
      pushToken: pushToken,
    });

    setLoading(false);

    if (result.success) {
      await refreshProfile(userId!);
      
      // IMPERATIVE REDIRECT Safeguard: Steer the user immediately to the correct homepage.
      // This guarantees the transition succeeds even if reactive context listeners experience delays.
      if (role === 'worker') {
        router.replace('/(worker)/home');
      } else {
        router.replace('/(recruiter)/home');
      }
    } else {
      Alert.alert('Error', result.error || 'Failed to create profile');
    }
  };

  // ─── Step 1: Role Selection ─────────────────────────────────────────
  if (step === 'role') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepIndicator}>{t('onboarding.step_1')}</Text>
          <Text style={styles.title}>{t('onboarding.title')}</Text>
          <Text style={styles.subtitle}>
            {t('onboarding.subtitle')}
          </Text>

          <View style={styles.roleCards}>
            {/* Worker Card */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                role === 'worker' && styles.roleCardSelected,
                role === 'worker' && Shadows.lg,
              ]}
              onPress={() => setRole('worker')}
              activeOpacity={0.8}
            >
              <Text style={styles.roleEmoji}>👷</Text>
              <Text
                style={[
                  styles.roleName,
                  role === 'worker' && styles.roleNameSelected,
                ]}
              >
                {t('onboarding.role_worker_title')}
              </Text>
              <Text style={styles.roleDescription}>
                {t('onboarding.role_worker_desc')}
              </Text>
              {role === 'worker' && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Recruiter Card */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                role === 'recruiter' && styles.roleCardRecruiterSelected,
                role === 'recruiter' && Shadows.lg,
              ]}
              onPress={() => setRole('recruiter')}
              activeOpacity={0.8}
            >
              <Text style={styles.roleEmoji}>🏢</Text>
              <Text
                style={[
                  styles.roleName,
                  role === 'recruiter' && styles.roleNameRecruiterSelected,
                ]}
              >
                {t('onboarding.role_recruiter_title')}
              </Text>
              <Text style={styles.roleDescription}>
                {t('onboarding.role_recruiter_desc')}
              </Text>
              {role === 'recruiter' && (
                <View style={[styles.checkmark, styles.checkmarkRecruiter]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Button
            title={t('auth.continue')}
            onPress={handleContinue}
            disabled={!role}
            size="lg"
          />
        </ScrollView>
      </View>
    );
  }

  // ─── Step 2: Profile Details ────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back to role selection */}
        <TouchableOpacity onPress={() => setStep('role')}>
          <Text style={styles.backText}>← {t('onboarding.change_role')}</Text>
        </TouchableOpacity>

        <Text style={styles.stepIndicator}>{t('onboarding.step_2')}</Text>
        <Text style={styles.title}>{t('onboarding.about_yourself')}</Text>
        <Text style={styles.subtitle}>
          {role === 'worker'
            ? t('onboarding.worker_subtitle')
            : t('onboarding.recruiter_subtitle')}
        </Text>

        {/* Name Input */}
        <Input
          label={t('onboarding.full_name')}
          placeholder={t('onboarding.name_placeholder')}
          value={fullName}
          onChangeText={setFullName}
          size="lg"
          autoCapitalize="words"
        />

        {/* Min Wage input removed as per user request */}

        {/* Skills Selection (Workers only) */}
        {role === 'worker' && (
          <>
            <Text style={styles.skillsTitle}>
              {t('onboarding.worker_skills_title')}
            </Text>
            <Text style={styles.skillsSubtitle}>{t('onboarding.skills_subtitle')}</Text>

            <Input
              placeholder={t('onboarding.custom_skill_placeholder', 'Enter other skills (e.g., Driving)...')}
              value={customSkillInput}
              onChangeText={setCustomSkillInput}
              onSubmitEditing={addCustomSkill}
              returnKeyType="done"
              size="lg"
            />

            <View style={styles.skillGrid}>
              {SKILL_CATEGORIES.map((skill) => (
                <TouchableOpacity
                  key={skill.id}
                  style={[
                    styles.skillChip,
                    selectedSkills.includes(skill.id) && styles.skillChipSelected,
                  ]}
                  onPress={() => toggleSkill(skill.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skillIcon}>{skill.icon}</Text>
                  <Text
                    style={[
                      styles.skillLabel,
                      selectedSkills.includes(skill.id) && styles.skillLabelSelected,
                    ]}
                  >
                    {skill.label}
                  </Text>
                </TouchableOpacity>
              ))}
              
              {selectedSkills
                .filter((s) => !SKILL_CATEGORIES.some((c) => c.id === s))
                .map((customSkill) => (
                  <TouchableOpacity
                    key={customSkill}
                    style={[styles.skillChip, styles.skillChipSelected]}
                    onPress={() => toggleSkill(customSkill)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.skillIcon}>📌</Text>
                    <Text style={[styles.skillLabel, styles.skillLabelSelected]}>
                      {customSkill}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </>
        )}

        <View style={styles.completeButton}>
          <Button
            title={t('onboarding.finish')}
            onPress={handleComplete}
            loading={loading}
            disabled={!fullName.trim()}
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: Spacing['2xl'],
    paddingTop: 60,
    paddingBottom: Spacing['5xl'],
  },
  backText: {
    fontSize: Typography.size.base,
    color: Colors.primary[700],
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  stepIndicator: {
    fontSize: Typography.size.sm,
    color: Colors.primary[600],
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wider,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: '800',
    color: Colors.light.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.light.textSecondary,
    marginBottom: Spacing['3xl'],
    lineHeight: Typography.lineHeight.base,
  },

  // Role Cards
  roleCards: {
    gap: Spacing.lg,
    marginBottom: Spacing['3xl'],
  },
  roleCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    position: 'relative',
    overflow: 'hidden',
  },
  roleCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  roleCardRecruiterSelected: {
    borderColor: Colors.accent[500],
    backgroundColor: Colors.accent[50],
  },
  roleEmoji: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  roleName: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.neutral[800],
    marginBottom: Spacing.xs,
  },
  roleNameSelected: {
    color: Colors.primary[800],
  },
  roleNameRecruiterSelected: {
    color: Colors.accent[800],
  },
  roleDescription: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[600],
    lineHeight: Typography.lineHeight.sm + 2,
  },
  checkmark: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkRecruiter: {
    backgroundColor: Colors.accent[500],
  },
  checkmarkText: {
    color: Colors.neutral[0],
    fontWeight: '700',
    fontSize: 16,
  },

  // Skills
  skillsTitle: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  skillsSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.lg,
  },
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    borderWidth: 1.5,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  skillChipSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  skillIcon: {
    fontSize: 16,
  },
  skillLabel: {
    fontSize: Typography.size.sm,
    fontWeight: '500',
    color: Colors.neutral[700],
  },
  skillLabelSelected: {
    color: Colors.primary[800],
    fontWeight: '600',
  },

  completeButton: {
    marginTop: Spacing.lg,
  },
});
