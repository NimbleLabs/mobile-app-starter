import { StyleSheet, TextInput, View, type TextInputProps, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontWeightFamily, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldProps = TextInputProps & {
  /** Rendered as an uppercase eyebrow above the input. */
  label?: string;
  /** Validation message rendered in the danger color below the input. */
  error?: string | null;
  /** Style for the outer wrapper (label + input + error). */
  containerStyle?: StyleProp<ViewStyle>;
};

/** Labeled text input using the standard input recipe. */
export function TextField({ label, error, containerStyle, style, editable, ...rest }: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={[styles.field, containerStyle]}>
      {label ? (
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
          {label.toUpperCase()}
        </ThemedText>
      ) : null}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        editable={editable}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.border,
            color: theme.text,
          },
          editable === false && styles.disabled,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  label: { letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: FontWeightFamily.regular,
  },
  disabled: { opacity: 0.6 },
});
