// ============================================================================
// Recruiter Wallet Screen
// Balance card, transaction history, and payment status
// (Identical UX to worker wallet, adapted via profile role)
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { getUserTransactions, type Transaction } from '@/services/transactions';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Colors, Spacing, Typography, BorderRadius, APP_CONFIG } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function RecruiterWalletScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!profile?.id) return;
    const result = await getUserTransactions(profile.id, 'recruiter');
    if (!result.error) setTransactions(result.data as Transaction[]);
  }, [profile?.id]);

  useEffect(() => {
    fetchTransactions().finally(() => setLoading(false));
  }, [fetchTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const verificationVariant: Record<string, 'success' | 'warning' | 'error'> = {
    pending: 'warning',
    verified: 'success',
    disputed: 'error',
  };

  if (loading) return <LoadingSpinner fullScreen message={t('worker_wallet.loading')} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.walletHeader}>
        <Text style={styles.walletLabel}>{t('common.balance')}</Text>
        <Text style={styles.walletBalance}>
          {APP_CONFIG.CURRENCY_SYMBOL}{profile?.wallet_balance?.toLocaleString('en-IN') || '0'}
        </Text>
        <View style={[styles.walletCircle, styles.walletCircle1]} />
        <View style={[styles.walletCircle, styles.walletCircle2]} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('recruiter_wallet.payment_history')}</Text>
        <Text style={styles.sectionCount}>{transactions.length} records</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.txCard}>
            <View style={styles.txRow}>
              <View style={styles.txIcon}>
                <Text style={styles.txIconText}>
                  {item.verification_status === 'verified' ? '✅' : '⏳'}
                </Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txTitle} numberOfLines={1}>
                  {(item.job as any)?.work_name || 'Payment'}
                </Text>
                <Text style={styles.txDate}>
                  {new Date(item.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </Text>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>
                  -{APP_CONFIG.CURRENCY_SYMBOL}{item.amount}
                </Text>
                <Badge
                  text={item.verification_status}
                  variant={verificationVariant[item.verification_status]}
                  size="sm"
                />
              </View>
            </View>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={Colors.neutral[0]} colors={[Colors.accent[500]]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyTitle}>{t('recruiter_wallet.no_payments')}</Text>
            <Text style={styles.emptySubtitle}>{t('recruiter_wallet.payment_history_msg')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  walletHeader: {
    backgroundColor: Colors.accent[700],
    paddingTop: 56, paddingBottom: Spacing['3xl'], paddingHorizontal: Spacing['2xl'],
    borderBottomLeftRadius: BorderRadius['3xl'], borderBottomRightRadius: BorderRadius['3xl'],
    overflow: 'hidden', position: 'relative',
  },
  walletLabel: {
    fontSize: Typography.size.sm, color: 'rgba(255,255,255,0.7)', fontWeight: '500',
    textTransform: 'uppercase', letterSpacing: Typography.letterSpacing.wider,
  },
  walletBalance: { fontSize: Typography.size['4xl'], fontWeight: '900', color: Colors.neutral[0], marginTop: Spacing.xs },
  walletCircle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  walletCircle1: { width: 180, height: 180, top: -30, right: -50 },
  walletCircle2: { width: 100, height: 100, bottom: -20, right: 60 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing['2xl'], paddingTop: Spacing['2xl'], paddingBottom: Spacing.md,
  },
  sectionTitle: { fontSize: Typography.size.md, fontWeight: '700', color: Colors.light.textPrimary },
  sectionCount: { fontSize: Typography.size.sm, color: Colors.neutral[500] },

  listContent: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['5xl'], gap: Spacing.sm },
  txCard: { padding: Spacing.md },
  txRow: { flexDirection: 'row', alignItems: 'center' },
  txIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  txIconText: { fontSize: 18 },
  txInfo: { flex: 1, marginRight: Spacing.md },
  txTitle: { fontSize: Typography.size.base, fontWeight: '600', color: Colors.light.textPrimary },
  txDate: { fontSize: Typography.size.xs, color: Colors.neutral[500], marginTop: Spacing.xxs },
  txRight: { alignItems: 'flex-end', gap: Spacing.xs },
  txAmount: { fontSize: Typography.size.md, fontWeight: '800', color: Colors.error.dark },

  empty: { alignItems: 'center', paddingTop: Spacing['5xl'] },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.neutral[700] },
  emptySubtitle: { fontSize: Typography.size.base, color: Colors.neutral[500], marginTop: Spacing.xs },
});
