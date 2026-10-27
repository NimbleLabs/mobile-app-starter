import { useColorScheme as useRNColorScheme } from 'react-native';

export type ColorScheme = 'light' | 'dark';

/**
 * The scheme the app is drawn in: the iPhone's Light/Dark setting, updating
 * live when it changes. Read the scheme through this hook (or `useTheme()`),
 * not react-native's, which can also return 'unspecified' or null.
 */
export function useColorScheme(): ColorScheme {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
