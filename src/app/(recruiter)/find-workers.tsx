// ============================================================================
// Find Workers Screen
// List of nearby online workers with skill filters
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
  Linking,
  Alert,
} from 'react-native';
import { getCurrentLocation, getNearbyWorkers } from '@/services/location';
import { supabase } from '@/services/supabase';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Colors, Spacing, Typography, BorderRadius, APP_CONFIG, SKILL_CATEGORIES } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface Worker {
  id: string;
  full_name: string;
  phone_number: string;
  is_online: boolean;
  desired_skills: string[];
  min_wage_floor: number;
  distance_km?: number;
  translations?: Record<string, any>;
}

export default function FindWorkersScreen() {
  const { t, i18n } = useTranslation();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [allOnlineCount, setAllOnlineCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorkers = useCallback(async () => {
    // Fetch total count of ALL online workers (no radius filter)
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'worker')
      .eq('is_online', true);
    setAllOnlineCount(count || 0);

    // Fetch nearby workers with distance for search results
    const coords = await getCurrentLocation();
    const result = await getNearbyWorkers(
      coords?.latitude || 0,
      coords?.longitude || 0,
      APP_CONFIG.DEFAULT_SEARCH_RADIUS_KM
    );
    if (!result.error) setWorkers(result.data as Worker[]);
  }, []);

  useEffect(() => {
    fetchWorkers().finally(() => setLoading(false));
  }, [fetchWorkers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkers();
    setRefreshing(false);
  };

  const handleCall = async (phoneNumber: string) => {
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

  const getSkillLabel = (skillId: string) => {
    return t(`skills.${skillId}` as any) || skillId;
  };
  const getSkillIcon = (skillId: string) => {
    return SKILL_CATEGORIES.find((s) => s.id === skillId)?.icon || '🛠️';
  };

  const filteredWorkers = workers
    .filter((worker) => {
      if (!worker.is_online) return false;
      if (!searchQuery.trim()) return false;
      const q = searchQuery.toLowerCase();
      const nameMatch = worker.full_name?.toLowerCase().includes(q);
      const skillMatch = worker.desired_skills?.some(s => getSkillLabel(s).toLowerCase().includes(q));
      return nameMatch || skillMatch;
    })
    .sort((a, b) => {
      // Sort by distance ascending (closest first); workers without distance go to the end
      const distA = a.distance_km ?? Infinity;
      const distB = b.distance_km ?? Infinity;
      return distA - distB;
    });

  if (loading) return <LoadingSpinner fullScreen message={t('worker_home.finding_jobs')} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>{t('recruiter_find_workers.title')}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder={t('recruiter_find_workers.search_placeholder', 'Search by name or work...')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Text style={{ fontSize: 18, opacity: 0.5 }}>🔍</Text>}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      <FlatList
        data={filteredWorkers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const appLang = i18n.language || 'en';
          const translatedName = item.translations?.[appLang]?.full_name || item.full_name;
          
          return (
          <Card style={styles.workerCard}>
            <View style={styles.workerRow}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(translatedName || '?')[0].toUpperCase()}
                  </Text>
                </View>
                {item.is_online && <View style={styles.onlineDot} />}
              </View>

              {/* Info */}
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{translatedName}</Text>
                <View style={styles.metaRow}>
                  {item.min_wage_floor > 0 && (
                    <Text style={styles.metaText}>
                      {APP_CONFIG.CURRENCY_SYMBOL}{item.min_wage_floor}/day min
                    </Text>
                  )}
                  {item.distance_km != null && (
                    <Text style={styles.distanceText}>
                      📍 {item.distance_km.toFixed(1)} km away
                    </Text>
                  )}
                </View>


              </View>

              {/* Call */}
              <TouchableOpacity style={styles.callButton} onPress={() => handleCall(item.phone_number)}>
                <Text style={styles.callIcon}>📞</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={Colors.primary[600]} colors={[Colors.primary[600]]} />
        }
        ListEmptyComponent={
          !searchQuery.trim() ? (
            <View style={styles.empty}>
              <View style={styles.countHighlight}>
                <Text style={styles.countHighlightText}>{allOnlineCount}</Text>
              </View>
              <Text style={styles.emptyTitle}>
                {t('find_workers.ready_count', { count: allOnlineCount }) || `${allOnlineCount} workers ready for work`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {t('find_workers.search_subtitle') || "Type a name or skill to find workers ready for work"}
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👷</Text>
              <Text style={styles.emptyTitle}>{t('recruiter_find_workers.no_workers_found')}</Text>
              <Text style={styles.emptySubtitle}>
                {t('recruiter_find_workers.try_different_filters')}
              </Text>
            </View>
          )
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

  searchContainer: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },

  listContent: { padding: Spacing['2xl'], gap: Spacing.md, paddingBottom: Spacing['5xl'] },

  workerCard: { padding: Spacing.lg },
  workerRow: { flexDirection: 'row', alignItems: 'flex-start' },

  avatarContainer: { position: 'relative', marginRight: Spacing.md },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.accent[500],
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.neutral[0] },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.online,
    borderWidth: 2, borderColor: Colors.neutral[0],
  },

  workerInfo: { flex: 1 },
  workerName: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.light.textPrimary },
  metaRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xxs },
  metaText: { fontSize: Typography.size.xs, color: Colors.neutral[500], fontWeight: '500' },
  distanceText: { fontSize: Typography.size.xs, color: Colors.accent[500], fontWeight: '600' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },

  callButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.success.light,
    justifyContent: 'center', alignItems: 'center',
  },
  callIcon: { fontSize: 18 },

  empty: { alignItems: 'center', paddingTop: Spacing['3xl'] },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.neutral[700], textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.size.base, color: Colors.neutral[500], marginTop: Spacing.xs, textAlign: 'center' },
  
  countHighlight: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.accent[500] + '15',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2, borderColor: Colors.accent[500] + '30',
  },
  countHighlightText: {
    fontSize: 42, fontWeight: '900', color: Colors.accent[700],
  },
});
