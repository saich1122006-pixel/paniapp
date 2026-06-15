// ============================================================================
// Recruiter Home (Dashboard)
// Posted jobs overview with status counts and job list
// ============================================================================

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { APP_CONFIG, BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getRecruiterJobs, type Job } from '@/services/jobs';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type TabKey = 'open' | 'matched' | 'completed';

const TABS = (t: any): { key: TabKey; label: string; icon: string }[] => [
  { key: 'open', label: t('worker_my_jobs.tab_active'), icon: '⚡' },
  { key: 'matched', label: t('status.matched'), icon: '🤝' },
  { key: 'completed', label: t('worker_my_jobs.tab_done'), icon: '✅' },
];

export default function RecruiterHomeScreen() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('open');

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

  const filteredJobs = jobs.filter((j) => j.status === activeTab);

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
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{t('home.recruiter_dashboard')}</Text>
          <Text style={styles.userName}>{t('home.greeting', { name: profile?.full_name || 'Recruiter' })}</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationBtn} 
          activeOpacity={0.7}
          onPress={() => router.push('/(shared)/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={Colors.neutral[700]} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards - tappable to switch tabs */}
      <View style={styles.statsRow}>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: Colors.info.light }, activeTab === 'open' && styles.statCardActive]}
          onPress={() => setActiveTab('open')}
          activeOpacity={0.7}
        >
          <Text style={[styles.statNumber, { color: Colors.info.dark }]}>{counts.open}</Text>
          <Text style={styles.statLabel}>{t('worker_my_jobs.tab_active')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: Colors.warning.light }, activeTab === 'matched' && styles.statCardActive]}
          onPress={() => setActiveTab('matched')}
          activeOpacity={0.7}
        >
          <Text style={[styles.statNumber, { color: Colors.warning.dark }]}>{counts.matched}</Text>
          <Text style={styles.statLabel}>{t('status.matched')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: Colors.success.light }, activeTab === 'completed' && styles.statCardActive]}
          onPress={() => setActiveTab('completed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.statNumber, { color: Colors.success.dark }]}>{counts.completed}</Text>
          <Text style={styles.statLabel}>{t('worker_my_jobs.tab_done')}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg, marginHorizontal: Spacing['2xl'] }}>
        <TouchableOpacity
          style={[styles.gridActionCard, { backgroundColor: Colors.primary[600] }]}
          onPress={() => router.push('/(recruiter)/find-workers' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.gridActionIcon}>⚡</Text>
          <Text style={styles.gridActionText}>{t('recruiter_home.instant_workers')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gridActionCard, { backgroundColor: Colors.accent[500] }]}
          onPress={() => router.push('/(recruiter)/post-job' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.gridActionIcon}>➕</Text>
          <Text style={styles.gridActionText}>{t('recruiter_home.post_new_job')}</Text>
        </TouchableOpacity>
      </View>

      {/* Jobs List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('recruiter_home.active_jobs')}</Text>
        <Text style={styles.sectionCount}>{filteredJobs.length} {t('worker_my_jobs.total_jobs').replace('jobs', '')}</Text>
      </View>

      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const appLang = i18n.language || 'en';
          const title = (item as any).translations?.[appLang]?.work_name || item.work_name;
          const workerName = item.worker ? ((item.worker as any).translations?.[appLang]?.full_name || (item.worker as any).full_name) : null;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/(recruiter)/job-details?id=${item.id}` as any)}
            >
              <Card style={styles.jobCard}>
                <View style={styles.jobRow}>
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobName} numberOfLines={1}>{title}</Text>
                    <Text style={styles.jobDate}>
                      {new Date(item.created_at).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'te' ? 'te-IN' : 'en-IN', {
                        day: 'numeric', month: 'short'
                      })}
                      {workerName && ` • ${workerName}`}
                    </Text>
                  </View>
                  <View style={styles.jobRight}>
                    <Text style={styles.jobWage}>
                      {APP_CONFIG.CURRENCY_SYMBOL}{item.payment_amount}
                      <Text style={styles.jobWageUnit}> {t('job.for_hours', { hours: item.estimated_hours })}</Text>
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <Badge text={t(`status.${item.status}`) || item.status} variant={statusVariant[item.status]} size="sm" />
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
          )
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={Colors.primary[600]} colors={[Colors.primary[600]]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'open' ? '📝' : activeTab === 'matched' ? '🤝' : '✅'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'open' ? t('recruiter_home.no_jobs') :
                activeTab === 'matched' ? t('recruiter_home.no_matched_jobs') :
                  t('recruiter_home.no_completed_jobs')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'open' ? t('recruiter_home.post_job_msg') :
                activeTab === 'matched' ? t('recruiter_home.no_matched_jobs_msg') :
                  t('recruiter_home.no_completed_jobs_msg')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 56,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.neutral[0],
  },
  greeting: { fontSize: Typography.size.sm, color: Colors.neutral[500], fontWeight: '500', textTransform: 'uppercase', letterSpacing: Typography.letterSpacing.wider },
  userName: { fontSize: Typography.size.xl, fontWeight: '800', color: Colors.light.textPrimary, marginTop: Spacing.xxs },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },


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
  statCardActive: {
    borderWidth: 2,
    borderColor: Colors.primary[600],
  },

  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    gap: Spacing.xxs,
  },
  tabActive: { backgroundColor: Colors.primary[100] },
  tabIcon: { fontSize: 14 },
  tabText: { fontSize: Typography.size.sm, fontWeight: '500', color: Colors.neutral[600] },
  tabTextActive: { color: Colors.primary[800], fontWeight: '700' },
  tabCount: {
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 2,
  },
  tabCountActive: {
    backgroundColor: Colors.primary[600],
  },
  tabCountText: {
    fontSize: Typography.size.xs,
    fontWeight: '700',
    color: Colors.neutral[600],
  },
  tabCountTextActive: {
    color: Colors.neutral[0],
  },

  gridActionCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.sm,
    ...Shadows.md,
  },
  gridActionIcon: { fontSize: 24 },
  gridActionText: { fontSize: Typography.size.sm, fontWeight: '700', color: Colors.neutral[0], textAlign: 'center' },

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
