import { StyleSheet } from 'react-native';

import { ThemedView, type ThemedViewProps } from '@/components/themed-view';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CardProps = Omit<ThemedViewProps, 'type'>;

/** A raised surface: rounded, hairline border, soft shadow, padded content. */
export function Card({ style, ...rest }: CardProps) {
  const theme = useTheme();
  return (
    <ThemedView
      type="surface"
      style={[styles.card, { borderColor: theme.border }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadows.card,
  },
});
