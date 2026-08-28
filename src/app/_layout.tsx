/**
 * Root layout. Loads the Outfit brand font (holding the splash until it's
 * ready), wraps the whole app in <AuthProvider>, maps our design tokens onto
 * React Navigation's theme, starts analytics + error reporting, and uses a
 * Stack so the (auth) and (authed) groups can mount as siblings. Redirect
 * logic lives in each group's own _layout.
 */
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/contexts/auth';
import { APP_OPENED, startAnalytics, track } from '@/lib/analytics';
import { installErrorReporting } from '@/lib/logger';

// React Navigation paints headers, modals, and the area behind screens with
// its own theme — map our tokens onto it so nothing flashes stock blue/white.
const NavigationThemes = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
      card: Colors.light.surface,
      text: Colors.light.text,
      border: Colors.light.border,
      primary: Colors.light.primary,
      notification: Colors.light.danger,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
      card: Colors.dark.surface,
      text: Colors.dark.text,
      border: Colors.dark.border,
      primary: Colors.dark.primary,
      notification: Colors.dark.danger,
    },
  },
};

// Module-level so a dev-mode double-mount doesn't count two opens.
let appOpenedTracked = false;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    installErrorReporting();
    const stopAnalytics = startAnalytics();
    if (!appOpenedTracked) {
      appOpenedTracked = true;
      track(APP_OPENED);
    }
    return stopAnalytics;
  }, []);

  // Hold on the native splash until the brand font is ready to avoid a flash
  // of the system font. If loading fails outright, render anyway — a fallback
  // font beats a blank screen.
  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? NavigationThemes.dark : NavigationThemes.light}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(authed)" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
