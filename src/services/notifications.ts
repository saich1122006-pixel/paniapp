import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  job_id: string | null;
  title: string;
  body: string;
  type: 'job_accepted' | 'job_posted' | 'job_completed' | 'payment_received' | 'payment_sent' | 'general';
  is_read: boolean;
  created_at: string;
}

/**
 * Fetch all notifications for a user.
 */
export async function getUserNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }
  return { data: data as Notification[], error: null };
}

/**
 * Mark a specific notification as read.
 */
export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  return { success: !error, error: error?.message };
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  return { success: !error, error: error?.message };
}
