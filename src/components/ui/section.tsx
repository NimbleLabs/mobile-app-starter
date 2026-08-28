import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export type SectionProps = {
  /** Eyebrow label; rendered uppercase. */
  title: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** An uppercase eyebrow label followed by a gapped stack of children. */
export function Section({ title, children, style }: SectionProps) {
  return (
    <View style={[styles.section, style]}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.title}>
        {title.toUpperCase()}
      </ThemedText>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  title: { letterSpacing: 0.6 },
  body: { gap: Spacing.two },
});
