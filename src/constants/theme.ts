/**
 * Design tokens.
 *
 * Warm neutrals, soft rounded surfaces, gentle low-opacity shadows, and a
 * purple brand accent. Components read these tokens via `useTheme()` (or the
 * ThemedText / ThemedView / ui primitives) — no hard-coded hex should live in
 * screens or components.
 *
 * To re-brand: change `primary` / `primaryHover` in both schemes and the
 * `Brand` ramp below. Splash / adaptive-icon colors live in app.json.
 */

import '@/global.css';

import { Platform, type ViewStyle } from 'react-native';

export const Colors = {
  light: {
    // Text
    text: '#1e1b24', // warm near-black
    textSecondary: 'rgba(30, 27, 36, 0.6)',
    // Surfaces
    background: '#faf8ff', // soft off-white with a whisper of lavender
    surface: '#ffffff',
    backgroundElement: '#f3f0fb', // cards / chips (≈ brand.50)
    backgroundSelected: '#e9e4f7',
    border: 'rgba(30, 27, 36, 0.1)',
    // Brand
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    onPrimary: '#ffffff',
    // Semantic
    success: '#16a34a',
    danger: '#c0392b',
  },
  dark: {
    text: '#f3f0fb',
    textSecondary: 'rgba(243, 240, 251, 0.65)',
    background: '#141019', // deep warm-cool dark
    surface: '#1d1726',
    backgroundElement: '#241d30',
    backgroundSelected: '#2f2740',
    border: 'rgba(243, 240, 251, 0.12)',
    primary: '#8b5cf6', // lifted a step for contrast on dark surfaces
    primaryHover: '#7c3aed',
    onPrimary: '#ffffff',
    success: '#22c55e',
    danger: '#e05a4c',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Brand color ramp — the raw purple scale, independent of light/dark. Use these
 * when you need a specific shade (gradients, glows, splash) rather than a
 * semantic token.
 */
export const Brand = {
  50: '#f5f3ff',
  100: '#ede9fe',
  200: '#ddd6fe',
  500: '#7c3aed',
  600: '#6d28d9',
  700: '#5b21b6',
  900: '#4c1d95',
} as const;

/**
 * Outfit is the brand typeface (loaded in the root layout). React Native does
 * not synthesize weights for custom fonts, so each weight is its own family.
 * `FontWeightFamily` maps a semantic weight to the loaded family.
 */
export const FontWeightFamily = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
} as const;

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

/** Corner-radius scale (rounded, never sharp). */
export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  pill: 999,
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
