// ============================================================================
// Transactions Service
// Payment ledger operations for completed jobs
// ============================================================================

import { supabase } from './supabase';

export interface Transaction {
  id: string;
  job_id: string;
  recruiter_id: string;
  worker_id: string;
  amount: number;
  screenshot_url: string | null;
  worker_confirmed: boolean;
  verification_status: 'pending' | 'verified' | 'disputed';
  payment_method?: string;
  created_at: string;
  updated_at: string;
  // Joined
  job?: { work_name: string };
  recruiter?: { full_name: string };
  worker?: { full_name: string };
}

/**
 * Create a new transaction (recruiter pays worker).
 */
export async function createTransaction(params: {
  jobId: string;
  recruiterId: string;
  workerId: string;
  amount: number;
  paymentMethod: string;
  verificationStatus?: 'pending' | 'verified' | 'disputed';
  screenshotUrl?: string;
}) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      job_id: params.jobId,
      recruiter_id: params.recruiterId,
      worker_id: params.workerId,
      amount: params.amount,
      payment_method: params.paymentMethod,
      verification_status: params.verificationStatus || 'pending',
      screenshot_url: params.screenshotUrl || null,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Check if a transaction already exists for a given job.
 */
export async function getTransactionByJobId(jobId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, payment_method, verification_status, created_at')
    .eq('job_id', jobId)
    .limit(1)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Worker confirms receipt of payment.
 */
export async function confirmPayment(transactionId: string) {
  const { error } = await supabase
    .from('transactions')
    .update({
      worker_confirmed: true,
      verification_status: 'verified',
    })
    .eq('id', transactionId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Worker disputes a transaction.
 */
export async function disputeTransaction(transactionId: string) {
  const { error } = await supabase
    .from('transactions')
    .update({ verification_status: 'disputed' })
    .eq('id', transactionId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Get transactions for a user (worker or recruiter).
 */
export async function getUserTransactions(userId: string, role: 'worker' | 'recruiter') {
  const column = role === 'worker' ? 'worker_id' : 'recruiter_id';

  const { data, error } = await supabase
    .from('transactions')
    .select(
      '*, job:jobs(work_name), recruiter:profiles!recruiter_id(full_name), worker:profiles!worker_id(full_name)'
    )
    .eq(column, userId)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data || [], error: null };
}

/**
 * Upload payment screenshot.
 */
export async function uploadPaymentScreenshot(
  transactionId: string,
  fileUri: string,
  fileType: string = 'image/jpeg'
) {
  const fileName = `payments/${transactionId}_${Date.now()}.jpg`;

  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('payment-screenshots')
    .upload(fileName, blob, { contentType: fileType });

  if (uploadError) return { url: null, error: uploadError.message };

  const { data: urlData } = supabase.storage
    .from('payment-screenshots')
    .getPublicUrl(fileName);

  // Update transaction with screenshot URL
  await supabase
    .from('transactions')
    .update({ screenshot_url: urlData.publicUrl })
    .eq('id', transactionId);

  return { url: urlData.publicUrl, error: null };
}

/**
 * Get wallet balance for a user.
 */
export async function getWalletBalance(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('wallet_balance')
    .eq('id', userId)
    .single();

  if (error) return { balance: 0, error: error.message };
  return { balance: data?.wallet_balance || 0, error: null };
}
