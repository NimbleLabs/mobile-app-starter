import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontWeightFamily, Radii, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  variant?: ButtonVariant;
  /** Shows a spinner in place of the label and disables presses. */
  loading?: boolean;
  /** Label text. `children` wins if both are given. */
  title?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

/**
 * The one button. Variants:
 *  - primary   — filled brand color, the main action on a screen
 *  - secondary — filled with the element background, quieter
 *  - outline   — bordered, brand-colored label
 *  - ghost     — no chrome, brand-colored label
 *  - danger    — bordered, danger-colored label (destructive, but not shouty)
 */
export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  title,
  children,
  style,
  textStyle,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const container: ViewStyle = {
    primary: { backgroundColor: theme.primary, ...Shadows.pill },
    secondary: { backgroundColor: theme.backgroundElement },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.danger },
  }[variant];

  const labelColor = {
    primary: theme.onPrimary,
    secondary: theme.text,
    outline: theme.primary,
    ghost: theme.primary,
    danger: theme.danger,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        container,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : typeof children === 'string' || children === undefined ? (
        <ThemedText style={[styles.label, { color: labelColor }, textStyle]}>
          {children ?? title}
        </ThemedText>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.6 },
  label: {
    fontFamily: FontWeightFamily.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
});
