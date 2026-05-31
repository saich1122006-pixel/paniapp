// ============================================================================
// Worker - My Jobs Screen
// Lists accepted, completed, and cancelled jobs with tab filters
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { getWorkerJobs, type Job } from '@/services/jobs';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Colors, Spacing, Typography, BorderRadius, APP_CONFIG } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

type TabKey = 'matched' | 'completed';

const TABS = (t: any): { key: TabKey; label: string; icon: string }[] => [
  { key: 'matched', label: t('worker_my_jobs.tab_active') || 'Active', icon: '⚡' },
  { key: 'completed', label: t('worker_my_jobs.tab_done') || 'Done', icon: '✅' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
  open: 'info',
  matched: 'warning',
  completed: 'success',
  cancelled: 'error',
};

export default function MyJobsScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('matched');

  const fetchJobs = useCallback(async () => {
    if (!profile?.id) return;
    const result = await getWorkerJobs(profile.id);
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

  const filteredJobs = jobs.filter((j) => j.status === activeTab);

  if (loading) return <LoadingSpinner fullScreen message={t('worker_my_jobs.loading_jobs')} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>{t('worker_my_jobs.title')}</Text>
        <Text style={styles.subtitle}>{jobs.length} {t('worker_my_jobs.total_jobs')}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS(t).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.jobCard}>
            <View style={styles.jobRow}>
              <View style={styles.jobInfo}>
                <Text style={styles.jobName} numberOfLines={1}>
                  {item.work_name}
                </Text>
                <Text style={styles.jobDate}>
                  {new Date(item.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.jobRight}>
                <Text style={styles.jobWage}>
                  {APP_CONFIG.CURRENCY_SYMBOL}{item.payment_amount}
                  <Text style={styles.jobWageUnit}> for {item.estimated_hours} hrs</Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Badge
                    text={item.status}
                    variant={statusVariant[item.status] || 'neutral'}
                    size="sm"
                  />
                  {item.recruiter && (item.recruiter as any).phone_number && (
                    <TouchableOpacity 
                      onPress={() => handleCall((item.recruiter as any).phone_number)}
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
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={Colors.primary[600]} colors={[Colors.primary[600]]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>{t('worker_my_jobs.no_jobs_found')}</Text>
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
  title: { fontSize: Typography.size.xl, fontWeight: '800', color: Colors.light.textPrimary },
  subtitle: { fontSize: Typography.size.sm, color: Colors.neutral[500], marginTop: Spacing.xxs },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
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
  listContent: { padding: Spacing['2xl'], paddingTop: Spacing.sm, gap: Spacing.md },
  jobCard: { padding: Spacing.lg },
  jobRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobInfo: { flex: 1, marginRight: Spacing.md },
  jobName: { fontSize: Typography.size.base, fontWeight: '600', color: Colors.light.textPrimary },
  jobDate: { fontSize: Typography.size.xs, color: Colors.neutral[500], marginTop: Spacing.xxs },
  jobRight: { alignItems: 'flex-end', gap: Spacing.xs },
  jobWage: { fontSize: Typography.size.md, fontWeight: '800', color: Colors.primary[700] },
  jobWageUnit: { fontSize: Typography.size.xs, fontWeight: '500', color: Colors.neutral[500] },
  empty: { alignItems: 'center', paddingTop: Spacing['6xl'] },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { fontSize: Typography.size.base, color: Colors.neutral[500], fontWeight: '500' },
});
