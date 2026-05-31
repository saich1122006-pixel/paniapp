// ============================================================================
// Badge Component
// Status badges, skill tags, and count indicators
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: string; // Emoji icon
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.success.light, text: Colors.success.dark },
  warning: { bg: Colors.warning.light, text: Colors.warning.dark },
  error: { bg: Colors.error.light, text: Colors.error.dark },
  info: { bg: Colors.info.light, text: Colors.info.dark },
  neutral: { bg: Colors.neutral[200], text: Colors.neutral[700] },
  primary: { bg: Colors.primary[100], text: Colors.primary[900] },
};

export default function Badge({
  text,
  variant = 'neutral',
  size = 'sm',
  icon,
  style,
}: BadgeProps) {
  const colors = variantColors[variant];

  return (
    <View
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: colors.bg },
        style,
      ]}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text
        style={[
          styles.text,
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: colors.text },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs + 1,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xxs,
  },
  md: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  icon: {
    fontSize: 12,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: Typography.size.xs,
  },
  textMd: {
    fontSize: Typography.size.sm,
  },
});
