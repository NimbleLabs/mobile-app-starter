import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Screen, Section } from '@/components/ui';
import { Branding } from '@/constants/branding';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';

const HINTS = [
  {
    title: 'Edit this screen',
    body: 'This is the Home tab.',
    code: 'src/app/(authed)/index.tsx',
  },
  {
    title: 'Design tokens',
    body: 'Colors, spacing, radii, and fonts live in one place. Read them via useTheme() — no hard-coded hex in screens.',
    code: 'src/constants/theme.ts',
  },
  {
    title: 'Report real bugs',
    body: 'Unhandled errors are sent to the backend Logs automatically. For a failure that leaves a user stuck, call:',
    code: "reportError(e, { context: { screen: 'home' } })",
  },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const greeting = user?.name?.trim() || user?.email || 'there';

  return (
    <Screen>
      <ThemedText type="title" style={styles.pageTitle}>
        {Branding.appName}
      </ThemedText>

      <Card>
        <ThemedText type="subtitle" style={styles.greeting}>
          Hi, {greeting}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{Branding.tagline}</ThemedText>
      </Card>

      <Section title="Get started">
        {HINTS.map((hint) => (
          <Card key={hint.title}>
            <ThemedText type="smallBold">{hint.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {hint.body}
            </ThemedText>
            <ThemedText type="code">{hint.code}</ThemedText>
          </Card>
        ))}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { marginBottom: -Spacing.two },
  greeting: { fontSize: 24, lineHeight: 30 },
});
