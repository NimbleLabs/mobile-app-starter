/**
 * Root layout. Wraps the whole app in <AuthProvider>, sets up theme +
 * animated splash, and uses a Stack so the (auth) and (authed) groups can
 * mount as siblings. Redirect logic lives in each group's own _layout.
 */
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/contexts/auth';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
