import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Alert, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getJob, completeJob, type Job } from '@/services/jobs';
import { createTransaction, getTransactionByJobId } from '@/services/transactions';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Colors, Spacing, Typography, BorderRadius, APP_CONFIG } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

const PAYMENT_METHODS = [
  { id: 'UPI', icon: '📱', name: 'UPI (Linked Mobile)' },
  { id: 'Cash', icon: '💵', name: 'Cash' },
];

export default function MakePaymentScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const params = useLocalSearchParams();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0].id);
  const [alreadyPaid, setAlreadyPaid] = useState(false);

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

      // Check if payment already exists for this job
      const { data: existingTx } = await getTransactionByJobId(jobId);
      if (existingTx) {
        setAlreadyPaid(true);
      }

      setLoading(false);
    };

    loadJob();
  }, [jobId]);

  const workerName = (job?.worker as any)?.full_name || 'Worker';
  const workerPhone = (job?.worker as any)?.phone_number || '';

  const handlePay = async () => {
    if (!profile?.id || !job || !job.accepted_by) return;

    // Prevent duplicate payment
    if (alreadyPaid) {
      Alert.alert('Already Paid', 'Payment has already been made for this job.');
      return;
    }

    // Double-check in the database to prevent race conditions
    const { data: existingTx } = await getTransactionByJobId(jobId);
    if (existingTx) {
      setAlreadyPaid(true);
      Alert.alert('Already Paid', 'Payment has already been recorded for this job.');
      return;
    }

    const processPayment = async () => {
      setPaying(true);

      // Complete the job
      const { success: completeSuccess, error: completeError } = await completeJob(jobId);
      if (!completeSuccess) {
        setPaying(false);
        Alert.alert('Error', completeError || 'Failed to complete job');
        return;
      }

      // Both Cash and UPI require worker confirmation because we do not receive a server callback from the UPI app
      const verificationStatus = 'pending';

      // Create the transaction
      const { data: tx, error: txError } = await createTransaction({
        jobId: job.id,
        recruiterId: profile.id,
        workerId: job.accepted_by,
        amount: job.payment_amount,
        paymentMethod: selectedMethod,
        verificationStatus,
      });

      setPaying(false);

      if (txError) {
        Alert.alert('Error', txError || 'Failed to create payment record');
      } else {
        const msg = `₹${job.payment_amount} payment via ${selectedMethod} recorded. Waiting for worker confirmation.`;
          
        Alert.alert(
          'Payment Recorded',
          msg,
          [
            { text: 'OK', onPress: () => router.replace('/(recruiter)/home' as any) }
          ]
        );
      }
    };

    if (selectedMethod === 'UPI') {
      // Extract the 10-digit mobile number (strip country code + prefix)
      let mobileNumber = workerPhone ? workerPhone.replace(/\D/g, '') : '';
      // If number has country code (e.g. 919876543210), strip it to get 10 digits
      if (mobileNumber.length > 10) {
        mobileNumber = mobileNumber.slice(-10);
      }

      if (mobileNumber && mobileNumber.length === 10) {
        // Pass bare 10-digit number as `pa` — UPI apps will search for linked UPI IDs
        // on this phone number and let the payer select the correct one.
        // This works across GPay, PhonePe, Paytm, and all NPCI-compliant UPI apps.
        const transactionNote = `Payment for ${job.work_name}`;
        const url = `upi://pay?pa=${mobileNumber}&pn=${encodeURIComponent(workerName)}&am=${job.payment_amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
        
        try {
          await Linking.openURL(url);
          // Ask for confirmation after they return from the UPI app
          Alert.alert(
            'Confirm Payment',
            'Did you successfully complete the payment in your UPI app?',
            [
              { text: 'No, Cancel', style: 'cancel' },
              { text: 'Yes, I paid', onPress: () => processPayment() }
            ]
          );
        } catch (err) {
          Alert.alert('No UPI App', 'No UPI app found on this device. Please install GPay, PhonePe, or Paytm and try again.');
        }
      } else {
        Alert.alert('Invalid Number', 'Worker phone number is missing or invalid for UPI payment. Please try Cash.');
      }
    } else {
      // For Cash payment, process immediately
      await processPayment();
    }
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
          <Text style={styles.headerTitle}>{t('payment.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('payment.pay_for')}{job.work_name}</Text>
        </View>

        <Card style={styles.amountCard}>
          <Text style={styles.amountLabel}>{t('payment.total_amount')}</Text>
          <Text style={styles.amountValue}>{APP_CONFIG.CURRENCY_SYMBOL}{job.payment_amount}</Text>
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{t('payment.paying')}{workerName}</Text>
            {workerPhone ? (
              <Text style={styles.workerPhone}>{t('payment.phone')}{workerPhone}</Text>
            ) : null}
          </View>
        </Card>

        {alreadyPaid && (
          <Card style={styles.alreadyPaidCard}>
            <Text style={styles.alreadyPaidIcon}>✅</Text>
            <Text style={styles.alreadyPaidTitle}>{t('payment.already_paid')}</Text>
            <Text style={styles.alreadyPaidText}>
              {t('payment.already_paid_text')}
            </Text>
          </Card>
        )}

        {!alreadyPaid && (
          <>
            <Text style={styles.sectionTitle}>{t('payment.select_method')}</Text>

            <View style={styles.methodsContainer}>
              {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedMethod === method.id;
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[styles.methodCard, isSelected && styles.methodCardSelected]}
                    onPress={() => setSelectedMethod(method.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.methodIcon}>{method.icon}</Text>
                    <View style={styles.methodTextContainer}>
                      <Text style={[styles.methodName, isSelected && styles.methodNameSelected]}>
                        {method.name}
                      </Text>
                    </View>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

      </ScrollView>

      <View style={styles.footer}>
        {alreadyPaid ? (
          <Button
            title={"← " + t('payment.go_back')}
            onPress={() => router.back()}
            variant="outline"
            size="lg"
            style={styles.payButton}
          />
        ) : (
          <Button
            title={t('payment.pay_amount_now', { amount: APP_CONFIG.CURRENCY_SYMBOL + job.payment_amount })}
            onPress={handlePay}
            loading={paying}
            size="lg"
            style={styles.payButton}
          />
        )}
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
  header: {
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: '800',
    color: Colors.light.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.size.base,
    color: Colors.neutral[500],
    marginTop: Spacing.xs,
  },
  amountCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.accent[50],
    borderColor: Colors.accent[200],
    borderWidth: 1,
    marginBottom: Spacing['2xl'],
  },
  amountLabel: {
    fontSize: Typography.size.sm,
    color: Colors.accent[700],
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: Typography.size['4xl'],
    fontWeight: '900',
    color: Colors.accent[800],
    marginVertical: Spacing.xs,
  },
  workerInfo: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  workerName: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  workerPhone: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    marginBottom: Spacing.md,
  },
  methodsContainer: {
    gap: Spacing.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
  },
  methodCardSelected: {
    borderColor: Colors.accent[500],
    backgroundColor: Colors.accent[50],
  },
  methodIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodName: {
    fontSize: Typography.size.base,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  methodNameSelected: {
    color: Colors.accent[800],
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: Colors.accent[600],
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent[600],
  },
  footer: {
    padding: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    backgroundColor: Colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  payButton: {
    width: '100%',
  },
  alreadyPaidCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 1,
    marginBottom: Spacing['2xl'],
  },
  alreadyPaidIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  alreadyPaidTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: Spacing.xs,
  },
  alreadyPaidText: {
    fontSize: Typography.size.sm,
    color: '#558B2F',
    textAlign: 'center',
  },
});
