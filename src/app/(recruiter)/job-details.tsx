import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getJob, deleteJob, completeJob, type Job } from '@/services/jobs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Colors, Spacing, Typography, BorderRadius, APP_CONFIG } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function JobDetailsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!jobId) {
      Alert.alert('Error', 'No job ID provided');
      router.back();
      return;
    }

    const loadJob = async () => {
      const { data, error } = await getJob(jobId);
      if (error || !data) {
        Alert.alert('Error', 'Failed to load job details');
        router.back();
        return;
      }
      setJob(data as Job);
      setLoading(false);
    };

    loadJob();
  }, [jobId]);

  const confirmDelete = () => {
    Alert.alert(
      t('common.delete') || 'Delete',
      t('recruiter_home.confirm_delete') || 'Are you sure you want to delete this job?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        { 
          text: t('common.delete') || 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { success, error } = await deleteJob(jobId);
            setDeleting(false);
            if (success) {
              router.replace('/(recruiter)/home' as any);
            } else {
              Alert.alert(t('common.error') || 'Error', error || 'Failed to delete job');
            }
          }
        }
      ]
    );
  };

  const handleComplete = () => {
    router.push(`/(recruiter)/make-payment?id=${jobId}` as any);
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{job.work_name}</Text>
          <View style={styles.statusRow}>
            <Badge text={job.status} variant={statusVariant[job.status]} size="md" />
            <Text style={styles.dateText}>
              Posted: {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Amount</Text>
            <Text style={styles.detailValue}>
              {APP_CONFIG.CURRENCY_SYMBOL}{job.payment_amount}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Time</Text>
            <Text style={styles.detailValue}>{job.estimated_hours} hours</Text>
          </View>
          
          {job.worker && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assigned Worker</Text>
                <Text style={styles.detailValue}>{(job.worker as any).full_name}</Text>
              </View>
            </>
          )}
        </Card>

      </ScrollView>

      <View style={styles.footerContainer}>
        <View style={styles.footer}>
          {job.status === 'matched' && (
            <Button
              title="✅ Complete Job"
              onPress={handleComplete}
              loading={completing}
              size="lg"
              style={styles.editButton}
            />
          )}
          {job.status === 'open' && (
            <Button
              title="✏️ Edit Job"
              onPress={() => router.push(`/(recruiter)/edit-job?id=${job.id}` as any)}
              variant="outline"
              size="lg"
              style={styles.editButton}
            />
          )}
          {job.status === 'open' && (
            <Button
              title="🗑️ Delete Job"
              onPress={confirmDelete}
              loading={deleting}
              variant="danger"
              size="lg"
              style={styles.deleteButton}
            />
          )}
        </View>
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => router.push({ pathname: '/(shared)/support', params: { jobId: job.id } })}
        >
          <Text style={styles.reportButtonText}>Report an Issue</Text>
        </TouchableOpacity>
      </View>
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

  footerContainer: {
    backgroundColor: Colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    padding: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  editButton: { flex: 1 },
  deleteButton: { flex: 1 },
  reportButton: {
    marginTop: Spacing.xl,
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
