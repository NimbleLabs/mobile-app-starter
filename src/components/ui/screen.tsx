import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, WebTabBarInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ScreenProps = {
  children: ReactNode;
  /** Pull-to-refresh state; both must be given to enable it. */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Set false for screens that manage their own scrolling (lists, etc.). */
  scroll?: boolean;
  /** Extra style for the content container. */
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Standard page wrapper for authed screens: themed background, top safe area,
 * content padded to clear the tab bar on every platform, centered and capped
 * at `MaxContentWidth` on wide screens.
 */
export function Screen({ children, refreshing, onRefresh, scroll = true, contentStyle }: ScreenProps) {
  const theme = useTheme();

  const content = [styles.content, contentStyle];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={content}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing ?? false}
                  onRefresh={onRefresh}
                  tintColor={theme.primary}
                  colors={[theme.primary]}
                />
              ) : undefined
            }>
            {children}
          </ScrollView>
        ) : (
          <View style={[content, styles.fill]}>{children}</View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  fill: { flex: 1 },
  content: {
    paddingTop: WebTabBarInset + Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
});
