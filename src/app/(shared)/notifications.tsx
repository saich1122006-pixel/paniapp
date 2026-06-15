// ============================================================================
// Notifications Screen
// Displays a list of all user notifications
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, type Notification } from '@/services/notifications';
import { supabase } from '@/services/supabase';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return;
    const result = await getUserNotifications(profile.id);
    if (!result.error) {
      setNotifications(result.data);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false));
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    if (!profile?.id) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await markAllNotificationsAsRead(profile.id);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.is_read) {
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
      await markNotificationAsRead(notification.id);
    }
    
    // Navigate based on type and job_id
    let targetJobId = notification.job_id;

    if (!targetJobId && notification.body) {
      // Fallback for old notifications where job_id might be missing:
      // Try to extract the job name from the body and find the active job
      try {
        let jobName = '';
        if (notification.body.includes(':')) {
          jobName = notification.body.split(':').pop()?.trim() || '';
        } else if (notification.body.includes('"')) {
          jobName = notification.body.split('"')[1] || '';
        }
        
        if (jobName) {
          const { data: fallbackJob } = await supabase
            .from('jobs')
            .select('id')
            .ilike('work_name', `%${jobName}%`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (fallbackJob) {
            targetJobId = fallbackJob.id;
          }
        }
      } catch (e) {
        console.warn("Fallback job lookup failed:", e);
      }
    }

    if (targetJobId) {
      try {
        if (profile?.role === 'worker') {
          router.push(`/(worker)/job-details/${targetJobId}` as any);
        } else {
          router.push(`/(recruiter)/job-details?id=${targetJobId}` as any);
        }
      } catch (err: any) {
        Alert.alert("Navigation Error", err?.message || "Failed to route");
      }
    } else {
      Alert.alert("No Job Attached", "This notification is either old or the job was deleted.");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_accepted': return '🤝';
      case 'job_completed': return '✅';
      case 'job_posted': return '⚡';
      case 'payment_received': return '💰';
      case 'payment_sent': return '💸';
      default: return '🔔';
    }
  };

  const getTranslatedTitle = (type: string, fallback: string) => {
    const key = `notifications.types.${type}.title`;
    const translated = t(key);
    return translated !== key ? translated : fallback;
  };

  const getTranslatedBody = (type: string, body: string, fallback: string) => {
    let variable = '';
    if (body.includes(':')) {
      variable = body.split(':').pop()?.trim() || '';
    } else if (body.includes('"')) {
      variable = body.split('"')[1] || '';
    } else if (body.includes('₹')) {
      variable = body.split('₹')[1]?.replace('.', '') || '';
    }
    
    const key = `notifications.types.${type}.body`;
    const translated = t(key, { value: variable });
    return translated !== key ? translated : fallback;
  };

  if (loading) return <LoadingSpinner fullScreen message={t('notifications.loading') || 'Loading notifications...'} />;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifications.title') || 'Notifications'}</Text>
          <View style={{ width: 44 }} /> {/* Placeholder for balance */}
        </View>
        
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllReadBtn}>
            <Text style={styles.markAllReadText}>{t('notifications.mark_all_read') || 'Mark all as read'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[600]} />
        }
        renderItem={({ item }) => (
          <Card 
            style={[styles.card, !item.is_read ? styles.unreadCard : null]}
            onPress={() => handleNotificationPress(item)}
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconContainer, !item.is_read ? styles.unreadIconContainer : null]}>
                <Text style={styles.icon}>{getNotificationIcon(item.type)}</Text>
              </View>
              <View style={styles.contentContainer}>
                <Text style={[styles.title, !item.is_read ? styles.unreadTitle : null]}>
                  {getTranslatedTitle(item.type, item.title)}
                </Text>
                <Text style={styles.body}>
                  {getTranslatedBody(item.type, item.body)}
                </Text>
                <Text style={styles.time}>
                  {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              {!item.is_read ? <View style={styles.unreadDot} /> : null}
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>{t('notifications.empty_title') || 'No Notifications'}</Text>
            <Text style={styles.emptySubtitle}>{t('notifications.empty_subtitle') || 'You have no notifications yet.'}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 56,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: {
    fontSize: 24,
    color: Colors.neutral[800],
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  markAllReadBtn: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.xs,
  },
  markAllReadText: {
    color: Colors.primary[600],
    fontSize: Typography.size.sm,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  unreadCard: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  unreadIconContainer: {
    backgroundColor: Colors.primary[100],
  },
  icon: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.size.base,
    fontWeight: '600',
    color: Colors.neutral[800],
    marginBottom: Spacing.xxs,
  },
  unreadTitle: {
    color: Colors.neutral[900],
    fontWeight: '800',
  },
  body: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[600],
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  time: {
    fontSize: Typography.size.xs,
    color: Colors.neutral[500],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[600],
    marginLeft: Spacing.sm,
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['6xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.neutral[800],
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
  },
});
