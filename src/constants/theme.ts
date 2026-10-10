/**
 * Design tokens.
 *
 * Warm neutrals, soft surfaces, gentle low-opacity shadows. Components read
 * these tokens via `useTheme()` (or the ThemedText / ThemedView / ui
 * primitives) — no hard-coded hex should live in screens or components.
 *
 * The brand half (primary and secondary colors, fonts, corner radii) comes
 * from `./branding`, which the Rails app generates from its config/app.yml
 * (bin/sync-mobile-theme), so web and mobile share one look. To re-brand,
 * change the theme there, not here. Splash / adaptive-icon colors live in
 * app.json.
 */

import '@/global.css';

import { Platform, type ViewStyle } from 'react-native';

import { BodyFont, BrandColors, BrandRadii, BrandRamp, DisplayFont } from './branding';

export const Colors = {
  light: {
    // Text
    text: '#1e1b24', // warm near-black
    textSecondary: 'rgba(30, 27, 36, 0.6)',
    // Surfaces
    background: '#faf8ff', // soft off-white with a whisper of lavender
    surface: '#ffffff',
    backgroundElement: BrandColors.light.surfaceMuted, // cards / chips
    backgroundSelected: BrandColors.light.surfaceSelected,
    border: 'rgba(30, 27, 36, 0.1)',
    // Brand
    primary: BrandColors.light.primary,
    primaryHover: BrandColors.light.primaryHover,
    onPrimary: BrandColors.light.onPrimary,
    secondary: BrandColors.light.secondary,
    // Semantic
    success: '#16a34a',
    danger: '#c0392b',
  },
  dark: {
    text: '#f3f0fb',
    textSecondary: 'rgba(243, 240, 251, 0.65)',
    background: '#141019', // deep warm-cool dark
    surface: '#1d1726',
    backgroundElement: BrandColors.dark.surfaceMuted,
    backgroundSelected: BrandColors.dark.surfaceSelected,
    border: 'rgba(243, 240, 251, 0.12)',
    primary: BrandColors.dark.primary, // lifted a step for contrast on dark surfaces
    primaryHover: BrandColors.dark.primaryHover,
    onPrimary: BrandColors.dark.onPrimary,
    secondary: BrandColors.dark.secondary,
    success: '#22c55e',
    danger: '#e05a4c',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Brand color ramp — the primary's scale, independent of light/dark. Use these
 * when you need a specific shade (gradients, glows, splash) rather than a
 * semantic token. 500 is the primary.
 */
export const Brand = BrandRamp;

/**
 * The body font, one family per weight: React Native does not synthesize
 * weights for custom fonts, so each weight is its own loaded family.
 * `FontWeightFamily` maps a semantic weight to it.
 */
export const FontWeightFamily = BodyFont;

/** The heading font (titles), at its heaviest weight. */
export const DisplayFontFamily = DisplayFont;

export const Fonts = Platform.select({
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-display)',
    mono: 'var(--font-mono)',
  },
  default: {
    sans: FontWeightFamily.regular,
    serif: 'serif',
    rounded: FontWeightFamily.regular,
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/**
 * Corner radii. `card`, `control` (buttons) and `field` (inputs) follow the
 * configured corner style; the numeric scale is for everything else.
 */
export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  pill: 999,
  ...BrandRadii,
} as const;

/** Soft, low-opacity elevation presets. */
export const Shadows: { card: ViewStyle; pill: ViewStyle } = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pill: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
// Web renders the tab bar as a fixed bar at the TOP; authed screens need this
// much top padding to clear it. Native tabs sit at the bottom (inset 0).
export const WebTabBarInset = Platform.OS === 'web' ? 64 : 0;
export const MaxContentWidth = 800;
