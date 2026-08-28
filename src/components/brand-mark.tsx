import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Branding } from '@/constants/branding';
import { Brand, FontWeightFamily } from '@/constants/theme';

type BrandMarkProps = {
  /** Width/height of the rounded tile in px. */
  size?: number;
  style?: ViewStyle;
};

/**
 * Static brand mark — a purple rounded tile with a short white wordmark
 * (`Branding.markText`). Text-based so it renders identically on iOS,
 * Android, and web. For the animated splash/hero variant see
 * {@link AnimatedIcon}.
 */
export function BrandMark({ size = 96, style }: BrandMarkProps) {
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size * 0.26,
        },
        style,
      ]}>
      <Text style={[styles.mark, { fontSize: size * 0.4 }]}>{Branding.markText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    experimental_backgroundImage: `linear-gradient(180deg, ${Brand[500]}, ${Brand[600]})`,
    backgroundColor: Brand[500],
  },
  mark: {
    color: '#ffffff',
    fontFamily: FontWeightFamily.bold,
    letterSpacing: -1,
  },
});
