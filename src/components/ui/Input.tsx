// ============================================================================
// Input Component
// Clean text input with floating label, error state, and icon support
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

export default function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  size = 'md',
  value,
  onFocus,
  onBlur,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, animatedValue]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const borderColor = error
    ? Colors.error.main
    : isFocused
    ? Colors.primary[600]
    : Colors.neutral[300];

  const labelColor = error
    ? Colors.error.main
    : isFocused
    ? Colors.primary[600]
    : Colors.neutral[500];

  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.inputContainer,
          styles[`inputSize_${size}`],
          { borderColor },
          isFocused && styles.inputFocused,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <View style={styles.inputWrapper}>
          {label && (
            <Animated.Text
              style={[
                styles.label,
                {
                  color: labelColor,
                  top: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [size === 'lg' ? 18 : 14, -9],
                  }),
                  fontSize: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [Typography.size.base, Typography.size.xs],
                  }),
                  backgroundColor: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['transparent', Colors.neutral[0]],
                  }),
                },
              ]}
            >
              {' '}{label}{' '}
            </Animated.Text>
          )}

          <TextInput
            style={[styles.input, styles[`textSize_${size}`]]}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor={Colors.neutral[400]}
            selectionColor={Colors.primary[500]}
            {...textInputProps}
            placeholder={label && !isFocused && !value ? '' : textInputProps.placeholder}
          />
        </View>

        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {(error || hint) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.neutral[0],
  },
  inputFocused: {
    borderWidth: 2,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    zIndex: 1,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    color: Colors.neutral[900],
    paddingHorizontal: Spacing.md,
  },
  leftIcon: {
    paddingLeft: Spacing.md,
  },
  rightIcon: {
    paddingRight: Spacing.md,
  },

  // ─── Sizes ──────────────────────────────────────────────────────────
  inputSize_sm: {
    minHeight: 44,
  },
  inputSize_md: {
    minHeight: 52,
  },
  inputSize_lg: {
    minHeight: 60,
  },
  textSize_sm: {
    fontSize: Typography.size.sm,
  },
  textSize_md: {
    fontSize: Typography.size.base,
  },
  textSize_lg: {
    fontSize: Typography.size.md,
  },

  // ─── Helper Text ────────────────────────────────────────────────────
  helperText: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.md,
    fontSize: Typography.size.xs,
    color: Colors.neutral[500],
  },
  errorText: {
    color: Colors.error.main,
  },
});
