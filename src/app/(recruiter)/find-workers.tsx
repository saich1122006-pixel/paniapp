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
}

export default function FindWorkersScreen() {
  const { t } = useTranslation();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorkers = useCallback(async () => {
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

  const filteredWorkers = workers.filter((worker) => {
    if (!worker.is_online) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = worker.full_name?.toLowerCase().includes(q);
    const skillMatch = worker.desired_skills?.some(s => getSkillLabel(s).toLowerCase().includes(q));
    return nameMatch || skillMatch;
  });

  if (loading) return <LoadingSpinner fullScreen message={t('worker_home.finding_jobs')} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>{t('recruiter_find_workers.title')}</Text>
        <Text style={styles.subtitle}>
          {filteredWorkers.length} {t('navigation.workers').toLowerCase()} {APP_CONFIG.DEFAULT_SEARCH_RADIUS_KM}km
        </Text>
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
        renderItem={({ item }) => (
          <Card style={styles.workerCard}>
            <View style={styles.workerRow}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.full_name || '?')[0].toUpperCase()}
                  </Text>
                </View>
                {item.is_online && <View style={styles.onlineDot} />}
              </View>

              {/* Info */}
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{item.full_name}</Text>
                <View style={styles.metaRow}>
                  {item.min_wage_floor > 0 && (
                    <Text style={styles.metaText}>
                      {APP_CONFIG.CURRENCY_SYMBOL}{item.min_wage_floor}/day min
                    </Text>
                  )}
                  {item.distance_km && (
                    <Text style={styles.metaText}>
                      📍 {item.distance_km.toFixed(1)}km
                    </Text>
                  )}
                </View>

                {/* Skills */}
                {item.desired_skills && item.desired_skills.length > 0 && (
                  <View style={styles.skillsRow}>
                    {item.desired_skills.slice(0, 3).map((skill) => (
                      <Badge
                        key={skill}
                        text={getSkillLabel(skill)}
                        icon={getSkillIcon(skill)}
                        variant="primary"
                        size="sm"
                      />
                    ))}
                    {item.desired_skills.length > 3 && (
                      <Badge
                        text={`+${item.desired_skills.length - 3}`}
                        variant="neutral"
                        size="sm"
                      />
                    )}
                  </View>
                )}
              </View>

              {/* Call */}
              <TouchableOpacity style={styles.callButton} onPress={() => handleCall(item.phone_number)}>
                <Text style={styles.callIcon}>📞</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={Colors.primary[600]} colors={[Colors.primary[600]]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👷</Text>
            <Text style={styles.emptyTitle}>{t('recruiter_find_workers.no_workers_found')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('recruiter_find_workers.try_different_filters')}
            </Text>
          </View>
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
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },

  callButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.success.light,
    justifyContent: 'center', alignItems: 'center',
  },
  callIcon: { fontSize: 18 },

  empty: { alignItems: 'center', paddingTop: Spacing['5xl'] },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.neutral[700] },
  emptySubtitle: { fontSize: Typography.size.base, color: Colors.neutral[500], marginTop: Spacing.xs, textAlign: 'center' },
});
