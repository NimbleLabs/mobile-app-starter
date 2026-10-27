/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** The `Colors` set for the current scheme. Re-renders when the scheme changes. */
export function useTheme() {
  return Colors[useColorScheme()];
}
