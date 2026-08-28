import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, FontWeightFamily, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && [styles.linkPrimary, { color: theme.primary }],
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

// React Native applies weight by font family (Outfit ships one file per
// weight), so each text style names its own Outfit family rather than using
// `fontWeight`.
const styles = StyleSheet.create({
  small: {
    fontFamily: FontWeightFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: FontWeightFamily.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  default: {
    fontFamily: FontWeightFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: FontWeightFamily.bold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FontWeightFamily.semibold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.3,
  },
  link: {
    fontFamily: FontWeightFamily.medium,
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    fontFamily: FontWeightFamily.semibold,
    lineHeight: 30,
    fontSize: 14,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
