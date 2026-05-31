// ============================================================================
// Recruiter Tab Layout
// Bottom tab navigator for recruiter screens
// ============================================================================

import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

function TabIcon({ icon, label, focused }: { icon: keyof typeof Feather.glyphMap; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Feather name={icon} size={30} color={focused ? Colors.accent[300] : Colors.dark.textSecondary} />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function RecruiterLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home" label={t('navigation.home')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="post-job"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="plus-circle" label={t('navigation.post_job')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="find-workers"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="search" label={t('navigation.workers')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="credit-card" label={t('navigation.wallet')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="user" label={t('navigation.profile')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="edit-job"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="job-details"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="make-payment"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabIcon: { fontSize: 22, opacity: 0.5 },
  tabIconFocused: { opacity: 1 },
  tabLabel: { fontSize: Typography.size.xs, color: Colors.dark.textSecondary, fontWeight: '500', textAlign: 'center' },
  tabLabelFocused: { color: Colors.accent[300], fontWeight: '700' },
});
