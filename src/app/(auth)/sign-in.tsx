import { Link, useRouter } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, TextField } from '@/components/ui';
import { Branding } from '@/constants/branding';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { BASE_URL } from '@/lib/api';

// Resetting a password happens on the Rails app's own page (Devise's), which
// emails a link to set a new one. The person then comes back here to sign in.
const FORGOT_PASSWORD_URL = `${BASE_URL}/users/password/new`;

function openForgotPassword() {
  void openBrowserAsync(FORGOT_PASSWORD_URL, {
    presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
  });
}

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign in failed';
      Alert.alert('Sign in failed', message);
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
              Welcome back
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
              Sign in to {Branding.appName}
            </ThemedText>
          </ThemedView>

          <TextField
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={!submitting}
            testID="sign-in-email"
          />
          <TextField
            label="Password"
            placeholder="Password"
            secureTextEntry
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
            editable={!submitting}
            onSubmitEditing={handleSubmit}
            testID="sign-in-password"
          />
          <Pressable
            accessibilityRole="link"
            hitSlop={Spacing.two}
            onPress={openForgotPassword}
            style={styles.forgot}
            testID="sign-in-forgot-password">
            <ThemedText type="linkPrimary">Forgot password?</ThemedText>
          </Pressable>

          <Button loading={submitting} onPress={handleSubmit} style={styles.button} testID="sign-in-submit">
            Sign in
          </Button>

          <Link href="/sign-up" style={styles.link} testID="sign-in-to-sign-up">
            <ThemedText type="small" themeColor="textSecondary">
              Don&apos;t have an account?{' '}
            </ThemedText>
            <ThemedText type="linkPrimary">Sign up</ThemedText>
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
  forgot: { alignSelf: 'flex-end', marginTop: -Spacing.two },
  button: { marginTop: Spacing.one },
  link: { textAlign: 'center', marginTop: Spacing.two },
});
