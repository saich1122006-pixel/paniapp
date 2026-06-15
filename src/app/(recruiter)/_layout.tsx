// ============================================================================
// Recruiter Tab Layout
// Bottom tab navigator for recruiter screens
// ============================================================================

import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function RecruiterLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.accent[300],
        tabBarInactiveTintColor: Colors.dark.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: t('navigation.home'),
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post-job"
        options={{
          tabBarLabel: t('navigation.post_job'),
          tabBarIcon: ({ color }) => (
            <Feather name="plus-circle" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="find-workers"
        options={{
          tabBarLabel: t('navigation.workers'),
          tabBarIcon: ({ color }) => (
            <Feather name="search" size={24} color={color} />
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
