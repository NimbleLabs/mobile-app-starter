/**
 * (authed) group — anything under here requires a signed-in user.
 * If no user, bounce to /sign-in. Otherwise render the existing tab UI.
 */
import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useAuth } from '@/contexts/auth';

export default function AuthedLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect href="/sign-in" />;
  return <AppTabs />;
}
