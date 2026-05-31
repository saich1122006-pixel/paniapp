import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { createTicket, getUserTickets, SupportTicket } from '@/services/support';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function SupportScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const params = useLocalSearchParams();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [jobId, setJobId] = useState(params.jobId as string || '');

  useEffect(() => {
    loadTickets();
  }, [profile?.id]);

  const loadTickets = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data, error } = await getUserTickets(profile.id);
    if (!error && data) {
      setTickets(data);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!profile?.id) return;
    if (!subject.trim() || !description.trim()) {
      Alert.alert(t('common.error') || 'Error', t('support.fill_required'));
      return;
    }

    setSubmitting(true);
    const { data, error } = await createTicket({
      userId: profile.id,
      subject,
      description,
      jobId: jobId || undefined,
    });
    setSubmitting(false);

    if (error) {
      Alert.alert(t('common.error') || 'Error', error);
    } else {
      Alert.alert(
        t('common.success') || 'Success',
        t('support.success_msg'),
        [{ text: 'OK' }]
      );
      setSubject('');
      setDescription('');
      setJobId('');
      loadTickets(); // Refresh list
    }
  };

  const statusVariant: Record<string, 'info' | 'warning' | 'success'> = {
    open: 'info',
    in_progress: 'warning',
    resolved: 'success',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('support.title')}</Text>
        <Text style={styles.subtitle}>{t('support.subtitle')}</Text>
      </View>

      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>{t('support.submit_ticket')}</Text>
        
        <Text style={styles.label}>{t('support.subject')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('support.subject_placeholder')}
          value={subject}
          onChangeText={setSubject}
          placeholderTextColor={Colors.neutral[400]}
        />

        <Text style={styles.label}>{t('support.description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('support.description_placeholder')}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={Colors.neutral[400]}
        />

        {jobId ? (
          <Text style={styles.linkedJobText}>
            {t('support.linked_job')}{jobId.substring(0, 8)}...
          </Text>
        ) : null}

        <Button
          title={t('support.submit_btn')}
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitButton}
        />
      </Card>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>{t('support.past_tickets')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary[500]} style={{ marginTop: Spacing.xl }} />
      ) : tickets.length === 0 ? (
        <Text style={styles.emptyText}>{t('support.no_tickets')}</Text>
      ) : (
        tickets.map((ticket) => (
          <Card key={ticket.id} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketSubject}>{ticket.subject}</Text>
              <Badge 
                text={ticket.status.replace('_', ' ').toUpperCase()} 
                variant={statusVariant[ticket.status] || 'neutral'} 
              />
            </View>
            <Text style={styles.ticketDate}>
              {new Date(ticket.created_at).toLocaleDateString()}
            </Text>
            <Text style={styles.ticketDesc} numberOfLines={2}>
              {ticket.description}
            </Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing['2xl'], paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: Spacing['2xl'] },
  title: { fontSize: Typography.size['3xl'], fontWeight: '800', color: Colors.light.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.size.base, color: Colors.neutral[500] },
  
  formCard: { padding: Spacing.xl, marginBottom: Spacing['3xl'] },
  sectionTitle: { fontSize: Typography.size.xl, fontWeight: '700', color: Colors.light.textPrimary, marginBottom: Spacing.lg },
  
  label: { fontSize: Typography.size.sm, fontWeight: '600', color: Colors.neutral[700], marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.size.base,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.lg,
  },
  textArea: { minHeight: 100 },
  submitButton: { marginTop: Spacing.sm },
  linkedJobText: { fontSize: Typography.size.sm, color: Colors.primary[600], marginBottom: Spacing.md, fontStyle: 'italic' },
  
  listHeader: { marginBottom: Spacing.md },
  emptyText: { textAlign: 'center', color: Colors.neutral[500], marginTop: Spacing.xl, fontStyle: 'italic' },
  
  ticketCard: { padding: Spacing.lg, marginBottom: Spacing.md },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs },
  ticketSubject: { flex: 1, fontSize: Typography.size.base, fontWeight: '700', color: Colors.light.textPrimary, marginRight: Spacing.sm },
  ticketDate: { fontSize: Typography.size.xs, color: Colors.neutral[400], marginBottom: Spacing.sm },
  ticketDesc: { fontSize: Typography.size.sm, color: Colors.neutral[600] },
});
