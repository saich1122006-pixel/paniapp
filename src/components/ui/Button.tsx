// ============================================================================
// Button Component
// Premium button with gradient support, loading state, and haptic feedback
// ============================================================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    variant === 'primary' && !isDisabled && Shadows.md,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${size}`],
    styles[`textVariant_${variant}`],
    isDisabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.neutral[0] : Colors.primary[600]}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },

  // ─── Sizes ──────────────────────────────────────────────────────────
  size_sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  size_md: {
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xl,
  },
  size_lg: {
    paddingVertical: Spacing.lg + 2,
    paddingHorizontal: Spacing['2xl'],
  },

  // ─── Variants ───────────────────────────────────────────────────────
  variant_primary: {
    backgroundColor: Colors.primary[600],
  },
  variant_secondary: {
    backgroundColor: Colors.accent[500],
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary[600],
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: Colors.error.main,
  },

  // ─── Disabled ───────────────────────────────────────────────────────
  disabled: {
    opacity: 0.5,
  },

  // ─── Text ───────────────────────────────────────────────────────────
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_sm: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.lineHeight.sm,
  },
  text_md: {
    fontSize: Typography.size.base,
    lineHeight: Typography.lineHeight.base,
  },
  text_lg: {
    fontSize: Typography.size.md,
    lineHeight: Typography.lineHeight.md,
  },
  textVariant_primary: {
    color: Colors.neutral[0],
  },
  textVariant_secondary: {
    color: Colors.neutral[0],
  },
  textVariant_outline: {
    color: Colors.primary[600],
  },
  textVariant_ghost: {
    color: Colors.primary[600],
  },
  textVariant_danger: {
    color: Colors.neutral[0],
  },
  textDisabled: {
    opacity: 0.7,
  },
});
