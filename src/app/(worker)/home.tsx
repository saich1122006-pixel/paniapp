// ============================================================================
// Worker Home Screen
// Nearby jobs feed with search, skill filters, and pull-to-refresh
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  TextInput,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getNearbyJobs, type Job } from '@/services/jobs';
import { getCurrentLocation, type Coordinates } from '@/services/location';
import { updateProfile } from '@/services/auth';
import { supabase } from '@/services/supabase';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
  APP_CONFIG,
} from '@/constants/theme';

export default function WorkerHomeScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [isOnline, setIsOnline] = useState(profile?.is_online || false);

  const handleToggleOnline = async () => {
    if (!profile?.id) return;
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    
    await updateProfile(profile.id, {
      is_online: newStatus,
    });
  };

  const fetchJobs = useCallback(async () => {
    const coords = await getCurrentLocation();
    if (coords) setLocation(coords);

    const result = await getNearbyJobs(
      coords?.latitude || 0,
      coords?.longitude || 0,
      profile?.search_radius_km || APP_CONFIG.DEFAULT_SEARCH_RADIUS_KM,
      profile?.desired_skills || undefined
    );

    if (!result.error) {
      setJobs(result.data as Job[]);
    }
  }, [profile?.search_radius_km, profile?.desired_skills]);

  useEffect(() => {
    fetchJobs().finally(() => setLoading(false));

    // Subscribe to realtime updates on jobs to instantly add/remove jobs when accepted or dropped
    const channel = supabase
      .channel('public:jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        () => {
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchJobs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderJobCard = ({ item }: { item: Job }) => (
    <Card
      style={styles.jobCard}
      onPress={() => router.push(`/(worker)/job-details/${item.id}` as any)}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleRow}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {item.work_name}
          </Text>
          <Badge
            text={item.status.toUpperCase()}
            variant={item.status === 'open' ? 'success' : 'neutral'}
            size="sm"
          />
        </View>
        <Text style={styles.jobWage}>
          {APP_CONFIG.CURRENCY_SYMBOL}{item.payment_amount}
          <Text style={styles.jobWageUnit}> for {item.estimated_hours} hrs</Text>
        </Text>
      </View>

      {item.recruiter && (
        <View style={styles.recruiterRow}>
          <Text style={styles.recruiterIcon}>👤</Text>
          <Text style={styles.recruiterName} numberOfLines={1}>
            {(item.recruiter as any).full_name || 'Recruiter'}
          </Text>
        </View>
      )}

      <View style={styles.jobFooter}>
        <View style={[styles.jobMeta, { flex: 1 }]}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={[styles.metaText, { flex: 1 }]} numberOfLines={1}>
            {item.distance_km
              ? `${item.distance_km.toFixed(1)} km ${t('worker_home.away')}`
              : t('worker_home.nearby')}
            {item.location_address ? ` • ${item.location_address}` : ''}
          </Text>
        </View>
        <View style={styles.jobMeta}>
          <Text style={styles.metaIcon}>🕐</Text>
          <Text style={styles.metaText}>
            {getTimeAgo(item.created_at, t)}
          </Text>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message={t('worker_home.finding_jobs')} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t('home.worker_dashboard')}</Text>
          <Text style={styles.userName}>{t('home.greeting', { name: profile?.full_name || 'Worker' })}</Text>
        </View>
      </View>

      {/* BIG Available for Work Toggle */}
      <TouchableOpacity 
        style={[styles.bigToggleCard, isOnline ? styles.bigToggleActive : styles.bigToggleInactive]}
        onPress={handleToggleOnline}
        activeOpacity={0.9}
      >
        <View style={styles.bigToggleContent}>
          <View style={[styles.switchTrack, isOnline ? styles.switchTrackActive : styles.switchTrackInactive, { marginBottom: Spacing.md }]}>
             <View style={[styles.switchThumb, isOnline ? styles.switchThumbActive : styles.switchThumbInactive]} />
          </View>
          <Text style={[styles.bigToggleTitle, isOnline ? styles.bigToggleTitleActive : styles.bigToggleTitleInactive]}>
            {isOnline ? t('worker_profile.available_for_work') : t('worker_home.now_unavailable')}
          </Text>
          <Text style={[styles.bigToggleSubtitle, isOnline ? styles.bigToggleSubtitleActive : styles.bigToggleSubtitleInactive]}>
            {isOnline 
              ? t('worker_profile.recruiters_can_find') 
              : t('worker_home.turn_on_to_get_jobs', 'Turn on to let recruiters find you')}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{jobs.length}</Text>
          <Text style={styles.statLabel}>{t('worker_home.jobs_nearby')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {profile?.search_radius_km || APP_CONFIG.DEFAULT_SEARCH_RADIUS_KM}km
          </Text>
          <Text style={styles.statLabel}>{t('worker_home.radius')}</Text>
        </View>
      </View>

      {/* Jobs List */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJobCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[600]}
            colors={[Colors.primary[600]]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>{t('worker_home.no_jobs_nearby')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('worker_home.pull_to_refresh')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function getTimeAgo(dateString: string, t: any): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('worker_home.just_now');
  if (mins < 60) return `${mins}${t('worker_home.m_ago')}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${t('worker_home.h_ago')}`;
  const days = Math.floor(hrs / 24);
  return `${days}${t('worker_home.d_ago')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 56,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.neutral[0],
  },
  greeting: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
    fontWeight: '500',
  },
  userName: {
    fontSize: Typography.size.xl,
    fontWeight: '800',
    color: Colors.light.textPrimary,
    marginTop: Spacing.xxs,
  },
  
  // Big Toggle
  bigToggleCard: {
    marginHorizontal: Spacing['2xl'],
    marginTop: Spacing.xs,
    padding: Spacing.xl,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 2,
    ...Shadows.lg,
  },
  bigToggleActive: {
    backgroundColor: Colors.success.main,
    borderColor: Colors.success.dark,
  },
  bigToggleInactive: {
    backgroundColor: Colors.neutral[100],
    borderColor: Colors.neutral[300],
  },
  bigToggleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigToggleTitle: {
    fontSize: Typography.size.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
  bigToggleTitleActive: {
    color: Colors.neutral[0],
  },
  bigToggleTitleInactive: {
    color: Colors.neutral[600],
  },
  bigToggleSubtitle: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  bigToggleSubtitleActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  bigToggleSubtitleInactive: {
    color: Colors.neutral[500],
  },
  switchTrack: {
    width: 60,
    height: 32,
    borderRadius: 16,
    padding: 4,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: Colors.success.dark,
  },
  switchTrackInactive: {
    backgroundColor: Colors.neutral[300],
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.neutral[0],
    ...Shadows.sm,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  switchThumbInactive: {
    alignSelf: 'flex-start',
  },

  // Stats
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[0],
    marginHorizontal: Spacing['2xl'],
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.size.lg,
    fontWeight: '800',
    color: Colors.primary[700],
  },
  statLabel: {
    fontSize: Typography.size.xs,
    color: Colors.neutral[500],
    marginTop: Spacing.xxs,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.neutral[200],
  },

  // List
  listContent: {
    padding: Spacing['2xl'],
    paddingBottom: Spacing['5xl'],
    gap: Spacing.md,
  },

  // Job Card
  jobCard: {
    padding: Spacing.lg,
  },
  jobHeader: {
    marginBottom: Spacing.sm,
  },
  jobTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  jobTitle: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  jobWage: {
    fontSize: Typography.size.xl,
    fontWeight: '800',
    color: Colors.primary[700],
  },
  jobWageUnit: {
    fontSize: Typography.size.sm,
    fontWeight: '500',
    color: Colors.neutral[500],
  },
  recruiterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  recruiterIcon: {
    fontSize: 14,
  },
  recruiterName: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[600],
    fontWeight: '500',
  },
  jobFooter: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  metaIcon: {
    fontSize: 13,
  },
  metaText: {
    fontSize: Typography.size.xs,
    color: Colors.neutral[500],
    fontWeight: '500',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing['6xl'],
    paddingHorizontal: Spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.size.base,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.base,
  },
});
