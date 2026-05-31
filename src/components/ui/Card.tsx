// ============================================================================
// Card Component
// Elevated card with optional press handler and gradient support
// ============================================================================

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'filled';
  style?: ViewStyle;
  padding?: keyof typeof Spacing;
}

export default function Card({
  children,
  onPress,
  variant = 'elevated',
  style,
  padding = 'lg',
}: CardProps) {
  const cardStyles = [
    styles.base,
    { padding: Spacing[padding] },
    variant === 'elevated' && [styles.elevated, Shadows.md],
    variant === 'outlined' && styles.outlined,
    variant === 'filled' && styles.filled,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: Colors.neutral[0],
  },
  outlined: {
    backgroundColor: Colors.neutral[0],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  filled: {
    backgroundColor: Colors.neutral[100],
  },
});
