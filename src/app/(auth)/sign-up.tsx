import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, TextField } from '@/components/ui';
import { Branding } from '@/constants/branding';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp({ name: name.trim() || undefined, email: email.trim(), password });
      router.replace('/');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign up failed';
      Alert.alert('Sign up failed', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.form}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ThemedView style={styles.header}>
            <BrandMark size={64} />
            <ThemedText type="title" style={styles.title}>
              Create account
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
              Join {Branding.appName} — {Branding.tagline}
            </ThemedText>
          </ThemedView>

          <TextField
            label="Name"
            placeholder="Name (optional)"
            autoCapitalize="words"
            autoComplete="name"
            value={name}
            onChangeText={setName}
            editable={!submitting}
          />
          <TextField
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={!submitting}
          />
          <TextField
            label="Password"
            placeholder="6+ characters"
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
            editable={!submitting}
            onSubmitEditing={handleSubmit}
          />

          <Button loading={submitting} onPress={handleSubmit} style={styles.button}>
            Create account
          </Button>

          <Link href="/sign-in" style={styles.link}>
            <ThemedText type="small" themeColor="textSecondary">
              Already have an account?{' '}
            </ThemedText>
            <ThemedText type="linkPrimary">Sign in</ThemedText>
          </Link>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  form: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.four,
  },
  title: { textAlign: 'center', fontSize: 34, lineHeight: 40, marginTop: Spacing.two },
  subtitle: { textAlign: 'center' },
  button: { marginTop: Spacing.two },
  link: { textAlign: 'center', marginTop: Spacing.two },
});
