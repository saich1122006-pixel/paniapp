// ============================================================================
// Recruiter Profile Screen
// Edit profile, skills you hire for, language, and sign out
// ============================================================================

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { deleteAccount, signOut, updateProfile } from '@/services/auth';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

export default function RecruiterProfileScreen() {
  const { t, i18n } = useTranslation();
  const { profile, refreshProfile, setAuthState } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);

    const result = await updateProfile(profile.id, {
      full_name: fullName.trim(),
    });

    setSaving(false);

    if (result.success) {
      await refreshProfile();
      Alert.alert(t('common.saved'), t('common.profile_updated'));
    } else {
      Alert.alert(t('common.error'), result.error || t('common.failed_to_save'));
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        signOut().then(() => setAuthState('unauthenticated'));
      }
      return;
    }

    Alert.alert(t('common.sign_out'), t('common.sign_out_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.sign_out'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
          setAuthState('unauthenticated');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('common.delete_account_confirm'))) {
        deleteAccount().then((result) => {
          if (result.success) setAuthState('unauthenticated');
          else Alert.alert(t('common.error'), result.error || t('common.failed_to_delete_account'));
        });
      }
      return;
    }

    Alert.alert(
      t('common.delete_account'),
      t('common.delete_account_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAccount();
            if (result.success) {
              setAuthState('unauthenticated');
            } else {
              Alert.alert(t('common.error'), result.error || t('common.failed_to_delete_account'));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('recruiter_profile.title')}</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.full_name || '?')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{profile?.full_name}</Text>
          <Text style={styles.userPhone}>{profile?.phone_number}</Text>
          <Badge text={t('recruiter_profile.recruiter_badge')} variant="info" size="md" icon="🏢" />
        </View>

        <Text style={styles.sectionTitle}>{t('common.personal_info')}</Text>
        <Input
          label={t('common.full_name')}
          value={fullName}
          onChangeText={setFullName}
          size="lg"
        />

        <Text style={styles.sectionTitle}>{t('common.language')}</Text>
        <View style={styles.skillGrid}>
          {[
            { code: 'en', label: 'English', icon: '🇺🇸' },
            { code: 'hi', label: 'हिंदी', icon: '🇮🇳' },
            { code: 'te', label: 'తెలుగు', icon: '🇮🇳' },
          ].map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.skillChip,
                i18n.language === lang.code && styles.skillChipSelected,
              ]}
              onPress={() => i18n.changeLanguage(lang.code)}
            >
              <Text style={styles.skillIcon}>{lang.icon}</Text>
              <Text
                style={[
                  styles.skillLabel,
                  i18n.language === lang.code && styles.skillLabelSelected,
                ]}
              >
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title={t('common.save_changes')} onPress={handleSave} loading={saving} size="lg" variant="secondary" />

        {/* Support */}
        <Button
          title="Help & Support"
          onPress={() => router.push('/(shared)/support')}
          variant="secondary"
          size="lg"
          style={{ marginTop: Spacing.md }}
          icon={<Text style={{ fontSize: 16 }}>🎧</Text>}
        />

        {/* Legal Links */}
        <View style={styles.legalSection}>
          <TouchableOpacity onPress={() => router.push('/(shared)/terms-of-service')}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>•</Text>
          <TouchableOpacity onPress={() => router.push('/(shared)/privacy-policy')}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signOutSection}>
          <Button title={t('common.sign_out')} onPress={handleSignOut} variant="ghost" size="md" />
          <Button
            title={t('common.delete_account')}
            onPress={handleDeleteAccount}
            variant="danger"
            size="md"
            icon={<Text style={{ fontSize: 16 }}>🗑️</Text>}
            style={{ marginTop: Spacing.md }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollContent: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['6xl'] },
  header: { paddingTop: 56, paddingBottom: Spacing.md },
  title: { fontSize: Typography.size.xl, fontWeight: '800', color: Colors.light.textPrimary },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.xs },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.accent[500],
    justifyContent: 'center', alignItems: 'center', ...Shadows.lg,
  },
  avatarText: { fontSize: Typography.size['2xl'], fontWeight: '800', color: Colors.neutral[0] },
  userName: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.light.textPrimary },
  userPhone: { fontSize: Typography.size.sm, color: Colors.neutral[500] },
  sectionTitle: {
    fontSize: Typography.size.md, fontWeight: '700', color: Colors.light.textPrimary,
    marginBottom: Spacing.md, marginTop: Spacing.md,
  },
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  skillChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.neutral[0], borderWidth: 1.5, borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.xs,
  },
  skillChipSelected: { borderColor: Colors.accent[500], backgroundColor: Colors.accent[50] },
  skillIcon: { fontSize: 16 },
  skillLabel: { fontSize: Typography.size.sm, fontWeight: '500', color: Colors.neutral[700] },
  skillLabelSelected: { color: Colors.accent[800], fontWeight: '600' },
  signOutSection: { marginTop: Spacing['2xl'], alignItems: 'center' },
  legalSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing['3xl'],
  },
  legalLink: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
    fontWeight: '500',
  },
  legalDivider: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[300],
  },
});
