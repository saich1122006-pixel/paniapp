import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Alert, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getJob, acceptJob, workerDropJob, type Job } from '@/services/jobs';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Colors, Spacing, Typography, BorderRadius, APP_CONFIG } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function WorkerJobDetailsScreen() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const params = useLocalSearchParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!jobId) {
      Alert.alert(t('common.error') || 'Error', 'No job ID provided');
      router.back();
      return;
    }
    const loadJob = async () => {
      const { data, error, fromCache } = await getJob(jobId);
      if (error && !data) {
        Alert.alert(t('common.error') || 'Error', 'Failed to load job details');
        router.back();
        return;
      }
      setJob(data as Job);
      if (fromCache) setIsOffline(true);
      setLoading(false);
    };
    loadJob();
  }, [jobId]);

  const handleAcceptJob = async () => {
    if (!profile?.id) return;
    setAccepting(true);
    const { success, error } = await acceptJob(jobId, profile.id);
    setAccepting(false);

    if (success) {
      Alert.alert(
        t('common.success') || 'Success',
        t('worker_job_details.accept_success') || 'Job accepted successfully!',
        [{ text: 'OK', onPress: () => router.replace('/(worker)/my-jobs' as any) }]
      );
    } else {
      Alert.alert(t('common.error') || 'Error', error || 'Failed to accept job');
    }
  };

  const handleDropJob = async () => {
    if (!profile?.id) return;
    Alert.alert(
      t('worker_job_details.drop_confirm_title') || 'Cancel Job',
      t('worker_job_details.drop_confirm_msg') || 'Are you sure you want to cancel this job?',
      [
        { text: t('common.cancel') || 'Keep Job', style: 'cancel' },
        {
          text: t('worker_job_details.drop_button') || 'Cancel Job',
          style: 'destructive',
          onPress: async () => {
            setDropping(true);
            const { success, error } = await workerDropJob(jobId, profile.id);
            setDropping(false);

            if (success) {
              Alert.alert(
                t('common.success') || 'Success',
                t('worker_job_details.drop_success') || 'Job cancelled successfully.',
                [{ text: 'OK', onPress: () => router.replace('/(worker)/my-jobs' as any) }]
              );
            } else {
              Alert.alert(t('common.error') || 'Error', error || 'Failed to cancel job');
            }
          },
        },
      ]
    );
  };

  const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    open: 'info',
    matched: 'warning',
    completed: 'success',
    cancelled: 'error',
  };

  if (loading || !job) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  const isOpen = job.status === 'open';

  const appLang = i18n.language || 'en';
  const title = (job as any).translations?.[appLang]?.work_name || job.work_name;
  const recruiterName = job.recruiter ? ((job.recruiter as any).translations?.[appLang]?.full_name || (job.recruiter as any).full_name) : 'Recruiter';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.statusRow}>
            <Badge text={job.status.toUpperCase()} variant={statusVariant[job.status] || 'neutral'} size="md" />
            <Text style={styles.dateText}>
              Posted: {new Date(job.created_at).toLocaleDateString()}
            </Text>
          </View>
          {isOffline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineText}>⚠️ You are viewing offline cached data</Text>
            </View>
          )}
        </View>

        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('worker_job_details.payment_amount') || 'Payment Amount'}</Text>
            <Text style={styles.detailValue}>
              {APP_CONFIG.CURRENCY_SYMBOL}{job.payment_amount}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('worker_job_details.estimated_time') || 'Estimated Time'}</Text>
            <Text style={styles.detailValue}>{job.estimated_hours} hours</Text>
          </View>
          
          {job.work_date && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('post_job.work_date') || "Work Date"}</Text>
                <Text style={styles.detailValue}>{new Date(job.work_date).toLocaleDateString()}</Text>
              </View>
            </>
          )}
          
          <View style={styles.divider} />
          <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
            <Text style={styles.detailLabel}>{t('worker_job_details.location') || 'Location'}</Text>
            <View style={{ flex: 1, alignItems: 'flex-end', marginLeft: Spacing.md }}>
              <Text style={[styles.detailValue, { textAlign: 'right', marginBottom: Spacing.xs }]} numberOfLines={3}>
                {job.location_address || 'Location not provided'}
              </Text>
              {job.location_address && (
                <TouchableOpacity 
                  style={styles.mapButton}
                  onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location_address!)}`)}
                >
                  <Text style={styles.mapButtonText}>🗺️ Open in Maps</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {job.recruiter && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('worker_job_details.recruiter') || 'Recruiter'}</Text>
                <Text style={styles.detailValue}>{recruiterName}</Text>
              </View>
              {(job.status === 'matched' || job.status === 'completed') && (job.recruiter as any).phone_number && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('worker_job_details.contact') || 'Contact'}</Text>
                    <TouchableOpacity 
                      style={styles.phoneButton}
                      onPress={() => Linking.openURL(`tel:${(job.recruiter as any).phone_number}`)}
                    >
                      <Text style={styles.phoneButtonText}>📞 {(job.recruiter as any).phone_number}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          )}
        </Card>
      </ScrollView>

      {isOpen && (
        <View style={styles.footer}>
          <Button
            title={t('worker_job_details.accept_button') || 'Accept Job'}
            onPress={handleAcceptJob}
            loading={accepting}
            size="lg"
            style={styles.acceptButton}
          />
        </View>
      )}

      {job.status === 'matched' && job.accepted_by === profile?.id && (
        <View style={styles.footer}>
          <Button
            title={t('worker_job_details.drop_button') || 'Cancel Job'}
            onPress={handleDropJob}
            loading={dropping}
            size="lg"
            variant="danger"
            style={styles.acceptButton}
          />
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => router.push({ pathname: '/(shared)/support', params: { jobId: job.id } })}
          >
            <Text style={styles.reportButtonText}>Report an Issue</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollContent: {
    padding: Spacing['2xl'],
    paddingTop: 56,
    paddingBottom: Spacing['5xl'],
  },
  header: { marginBottom: Spacing['2xl'] },
  title: { fontSize: Typography.size['2xl'], fontWeight: '800', color: Colors.light.textPrimary, marginBottom: Spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dateText: { fontSize: Typography.size.sm, color: Colors.neutral[500] },
  
  detailsCard: { padding: Spacing.xl, marginBottom: Spacing['2xl'] },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  detailLabel: { fontSize: Typography.size.base, color: Colors.neutral[600], fontWeight: '500' },
  detailValue: { fontSize: Typography.size.base, color: Colors.light.textPrimary, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.neutral[200], marginVertical: Spacing.xs },

  footer: {
    padding: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    backgroundColor: Colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  acceptButton: { width: '100%' },
  phoneButton: {
    backgroundColor: Colors.success.light,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  phoneButtonText: {
    color: Colors.success.dark,
    fontWeight: '600',
  },
  mapButton: {
    backgroundColor: Colors.primary?.[100] || '#dbeafe',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
    alignSelf: 'flex-end',
  },
  mapButtonText: {
    color: Colors.primary?.[800] || '#1e40af',
    fontWeight: '600',
    fontSize: Typography.size.sm,
  },
  offlineBanner: {
    backgroundColor: Colors.warning.light,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  offlineText: {
    color: Colors.warning.dark,
    fontSize: Typography.size.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  reportButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
    padding: Spacing.sm,
  },
  reportButtonText: {
    color: Colors.neutral[500],
    fontSize: Typography.size.sm,
    fontWeight: '600',
    textDecorationLine: 'underline',
  }
});
