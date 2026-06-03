/**
 * (auth) group — sign-in / sign-up screens.
 * If a user is already authenticated, bounce them to the authed home.
 */
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/contexts/auth';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    />
  );
}
