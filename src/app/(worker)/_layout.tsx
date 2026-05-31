// ============================================================================
// Worker Tab Layout
// Bottom tab navigator for worker screens
// ============================================================================

import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

function TabIcon({ icon, label, focused }: { icon: keyof typeof Feather.glyphMap; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Feather name={icon} size={30} color={focused ? Colors.primary[500] : Colors.dark.textSecondary} />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function WorkerLayout() {
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
            <TabIcon icon="search" label={t('navigation.find_jobs')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-jobs"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="briefcase" label={t('navigation.my_jobs')} focused={focused} />
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
        name="job-details/[id]"
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
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: Typography.size.xs,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabLabelFocused: {
    color: Colors.primary[500],
    fontWeight: '700',
  },
});
