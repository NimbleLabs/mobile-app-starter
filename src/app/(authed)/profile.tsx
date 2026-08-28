import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen, Section } from '@/components/ui';
import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTheme } from '@/hooks/use-theme';
import { reportError } from '@/lib/logger';

function initialsFor(name: string | null | undefined, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/sign-in');
    } finally {
      setSigningOut(false);
    }
  }

  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  const platform = `${Platform.OS} ${Platform.Version ?? ''}`.trim();

  return (
    <Screen>
      <ThemedText type="title" style={styles.pageTitle}>
        Profile
      </ThemedText>

      <Card style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText type="subtitle" style={[styles.initials, { color: theme.onPrimary }]}>
            {user ? initialsFor(user.name, user.email) : '?'}
          </ThemedText>
        </View>
        <View style={styles.identityText}>
          <ThemedText type="smallBold" style={styles.name}>
            {user?.name?.trim() || 'No name yet'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {user?.email}
          </ThemedText>
        </View>
      </Card>

      <Section title="About">
        <Card>
          <Row label="Version" value={appVersion} />
          <Row label="Platform" value={platform} />
        </Card>
      </Section>

      <View style={styles.actions}>
        <Button variant="danger" loading={signingOut} onPress={handleSignOut}>
          Sign out
        </Button>

        {__DEV__ && (
          <Button
            variant="ghost"
            onPress={() =>
              reportError(new Error('Test error from mobile'), {
                level: 'warn',
                context: { screen: 'profile' },
              })
            }>
            Send test error (dev only)
          </Button>
        )}
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pageTitle: { marginBottom: -Spacing.two },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 22, lineHeight: 28 },
  identityText: { flex: 1, gap: Spacing.half },
  name: { fontSize: 18, lineHeight: 24 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: { gap: Spacing.two },
});
