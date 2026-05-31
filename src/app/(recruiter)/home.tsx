// ============================================================================
// Recruiter Home (Dashboard)
// Posted jobs overview with status counts and job list
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getRecruiterJobs, type Job } from '@/services/jobs';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Colors, Spacing, Typography, BorderRadius, Shadows, APP_CONFIG } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function RecruiterHomeScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    if (!profile?.id) return;
    const result = await getRecruiterJobs(profile.id);
    if (!result.error) setJobs(result.data as Job[]);
  }, [profile?.id]);

  useEffect(() => {
    fetchJobs().finally(() => setLoading(false));
  }, [fetchJobs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const handleCall = async (phoneNumber?: string) => {
    if (!phoneNumber) {
      Alert.alert(t('common.error'), 'No phone number available');
      return;
    }
    try {
      const url = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error'), 'Calling is not supported on this device');
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to open dialer');
    }
  };

  const counts = {
    open: jobs.filter((j) => j.status === 'open').length,
    matched: jobs.filter((j) => j.status === 'matched').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
  };

  const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    open: 'info',
    matched: 'warning',
    completed: 'success',
    cancelled: 'error',
  };

  if (loading) return <LoadingSpinner fullScreen message={t('recruiter_home.loading_dashboard')} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{t('home.recruiter_dashboard')}</Text>
        <Text style={styles.userName}>{t('home.greeting', { name: profile?.full_name || 'Recruiter' })}</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: Colors.info.light }]}>
          <Text style={[styles.statNumber, { color: Colors.info.dark }]}>{counts.open}</Text>
          <Text style={styles.statLabel}>{t('worker_my_jobs.tab_active')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.warning.light }]}>
          <Text style={[styles.statNumber, { color: Colors.warning.dark }]}>{counts.matched}</Text>
          <Text style={styles.statLabel}>Matched</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.success.light }]}>
          <Text style={[styles.statNumber, { color: Colors.success.dark }]}>{counts.completed}</Text>
          <Text style={styles.statLabel}>{t('worker_my_jobs.tab_done')}</Text>
        </View>
      </View>

      {/* Quick Action */}
      <TouchableOpacity
        style={styles.postButton}
        onPress={() => router.push('/(recruiter)/post-job' as any)}
        activeOpacity={0.8}
      >
        <Text style={styles.postButtonIcon}>➕</Text>
        <Text style={styles.postButtonText}>{t('recruiter_home.post_new_job')}</Text>
      </TouchableOpacity>

      {/* Jobs List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('recruiter_home.active_jobs')}</Text>
        <Text style={styles.sectionCount}>{jobs.length} {t('worker_my_jobs.total_jobs').replace('jobs', '')}</Text>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => router.push(`/(recruiter)/job-details?id=${item.id}` as any)}
          >
            <Card style={styles.jobCard}>
              <View style={styles.jobRow}>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobName} numberOfLines={1}>{item.work_name}</Text>
                  <Text style={styles.jobDate}>
                    {new Date(item.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short'
                    })}
                    {item.worker && ` • ${(item.worker as any).full_name}`}
                  </Text>
                </View>
                <View style={styles.jobRight}>
                  <Text style={styles.jobWage}>
                    {APP_CONFIG.CURRENCY_SYMBOL}{item.payment_amount}
                    <Text style={styles.jobWageUnit}> for {item.estimated_hours} hrs</Text>
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <Badge text={item.status} variant={statusVariant[item.status]} size="sm" />
                    {item.worker && (item.worker as any).phone_number && (
                      <TouchableOpacity 
                        onPress={() => handleCall((item.worker as any).phone_number)}
                        style={{
                          width: 40, height: 40, borderRadius: 20,
                          backgroundColor: Colors.success.light,
                          justifyContent: 'center', alignItems: 'center',
                          marginLeft: 4
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>📞</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={Colors.primary[600]} colors={[Colors.primary[600]]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>{t('recruiter_home.no_jobs')}</Text>
            <Text style={styles.emptySubtitle}>{t('recruiter_home.post_job_msg')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 56,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.neutral[0],
  },
  greeting: { fontSize: Typography.size.sm, color: Colors.neutral[500], fontWeight: '500', textTransform: 'uppercase', letterSpacing: Typography.letterSpacing.wider },
  userName: { fontSize: Typography.size.xl, fontWeight: '800', color: Colors.light.textPrimary, marginTop: Spacing.xxs },

  statsRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg,
  },
  statCard: {
    flex: 1, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, alignItems: 'center',
  },
  statNumber: { fontSize: Typography.size['2xl'], fontWeight: '900' },
  statLabel: { fontSize: Typography.size.xs, color: Colors.neutral[600], fontWeight: '500', marginTop: Spacing.xxs },

  postButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.accent[500],
    marginHorizontal: Spacing['2xl'], marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.sm,
    ...Shadows.md,
  },
  postButtonIcon: { fontSize: 18 },
  postButtonText: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.neutral[0] },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing['2xl'], paddingTop: Spacing['2xl'], paddingBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: Typography.size.md, fontWeight: '700', color: Colors.light.textPrimary },
  sectionCount: { fontSize: Typography.size.sm, color: Colors.neutral[500] },

  listContent: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['5xl'], gap: Spacing.sm },
  jobCard: { padding: Spacing.lg },
  jobRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobInfo: { flex: 1, marginRight: Spacing.md },
  jobName: { fontSize: Typography.size.base, fontWeight: '600', color: Colors.light.textPrimary },
  jobDate: { fontSize: Typography.size.xs, color: Colors.neutral[500], marginTop: Spacing.xxs },
  jobRight: { alignItems: 'flex-end', gap: Spacing.xs },
  jobWage: { fontSize: Typography.size.md, fontWeight: '800', color: Colors.accent[700] },
  jobWageUnit: { fontSize: Typography.size.xs, fontWeight: '500', color: Colors.neutral[500] },

  empty: { alignItems: 'center', paddingTop: Spacing['4xl'] },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.neutral[700] },
  emptySubtitle: { fontSize: Typography.size.base, color: Colors.neutral[500], marginTop: Spacing.xs },
});
