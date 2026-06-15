// ============================================================================
// Worker Tab Layout
// Bottom tab navigator for worker screens
// ============================================================================

import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function WorkerLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: Colors.dark.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: t('navigation.find_jobs'),
          tabBarIcon: ({ color }) => (
            <Feather name="search" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-jobs"
        options={{
          tabBarLabel: t('navigation.my_jobs'),
          tabBarIcon: ({ color }) => (
            <Feather name="briefcase" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: t('navigation.profile'),
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={24} color={color} />
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
    minHeight: 60,
    paddingBottom: 5,
    paddingTop: 5,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  tabLabel: {
    fontSize: Typography.size.xs,
    fontWeight: '500',
  },
});
