// Generated from config/app.yml by the Rails app's bin/sync-mobile-theme.
// Don't edit by hand: change the name or theme on the Rails admin's Theme
// page (or in config/app.yml), then rerun bin/sync-mobile-theme.

import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';

/** App identity: the brand mark, the web tab bar label and the auth screens' copy. */
export const Branding = {
  appName: 'Starter',
  markText: 'ST',
  tagline: 'Your app, ready to build on.',
} as const;

/** The brand colors and what's derived from them, light and dark (theme.ts maps them onto Colors). */
export const BrandColors = {
  light: { primary: '#7c3aed', primaryHover: '#6931c9', onPrimary: '#ffffff', secondary: '#6366f1', surfaceMuted: '#f7f3fe', surfaceSelected: '#efe7fd' },
  dark: { primary: '#9058f0', primaryHover: '#7a4bcc', onPrimary: '#ffffff', secondary: '#7a7df3', surfaceMuted: '#291e3a', surfaceSelected: '#34244e' },
} as const;

/** The primary's ramp, for gradients and the splash. 500 is the primary. */
export const BrandRamp = {
  50: '#f7f3fe',
  100: '#efe7fd',
  200: '#decefb',
  500: '#7c3aed',
  600: '#6931c9',
  700: '#5729a6',
  900: '#3e1d77',
} as const;

/** Corner radii for the "soft" corner style. */
export const BrandRadii = { card: 16, control: 16, field: 12 } as const;

/** Font files for useFonts() in the root layout. */
export const BrandFontFiles = {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
};

/** Outfit, one family per weight: React Native doesn't synthesize weights. */
export const BodyFont = { regular: 'Outfit_400Regular', medium: 'Outfit_500Medium', semibold: 'Outfit_600SemiBold', bold: 'Outfit_700Bold' } as const;

/** Headings: Outfit. */
export const DisplayFont = 'Outfit_800ExtraBold';
