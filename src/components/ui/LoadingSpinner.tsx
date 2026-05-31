// ============================================================================
// LoadingSpinner Component
// Full-screen and inline loading indicators
// ============================================================================

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export default function LoadingSpinner({
  fullScreen = false,
  message,
  size = 'large',
  color = Colors.primary[600],
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  inline: {
    padding: Spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: Spacing.lg,
    fontSize: Typography.size.base,
    color: Colors.neutral[600],
    fontWeight: '500',
  },
});
