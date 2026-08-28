/**
 * Visit identity for analytics.
 *
 * Every request to the Rails API carries `Ahoy-Visitor` and `Ahoy-Visit`
 * headers — the same headers ahoy's own JS tracker sends — so that the events
 * the server records (sign-up, sign-in, and whatever your app adds) attach to
 * a real device and session instead of opening a fresh visit each time. That
 * attachment is what lets a funnel follow one person from install onward.
 *
 * - visitor token: one per install, persisted forever. Anonymous — it is a
 *   random UUID, never anything derived from the device or the user.
 * - visit token: one per session, rotated after 30 minutes of inactivity to
 *   match `Ahoy.visit_duration` on the server.
 */
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const VISITOR_KEY = 'ahoy_visitor_token';
const VISIT_KEY = 'ahoy_visit_token';
const VISIT_SEEN_KEY = 'ahoy_visit_seen_at';

/** Matches Ahoy.visit_duration in config/initializers/ahoy.rb. */
const VISIT_TTL_MS = 30 * 60 * 1000;

const isWeb = Platform.OS === 'web';

async function read(key: string): Promise<string | null> {
  try {
    if (isWeb) return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string): Promise<void> {
  try {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Storage being unavailable must never break a request — the worst case is
    // that this session is counted as a new visitor.
  }
}

function newToken(): string {
  return Crypto.randomUUID();
}

// Held in memory as well so a burst of requests can't race each other into
// separate visits before the first write lands.
let visitorToken: string | null = null;
let visitToken: string | null = null;
let visitSeenAt = 0;

async function getVisitorToken(): Promise<string> {
  if (visitorToken) return visitorToken;

  const stored = await read(VISITOR_KEY);
  visitorToken = stored ?? newToken();
  if (!stored) await write(VISITOR_KEY, visitorToken);
  return visitorToken;
}

async function getVisitToken(): Promise<string> {
  const now = Date.now();

  if (!visitToken) {
    visitToken = await read(VISIT_KEY);
    visitSeenAt = Number(await read(VISIT_SEEN_KEY)) || 0;
  }

  if (!visitToken || now - visitSeenAt > VISIT_TTL_MS) {
    visitToken = newToken();
    await write(VISIT_KEY, visitToken);
  }

  visitSeenAt = now;
  await write(VISIT_SEEN_KEY, String(now));
  return visitToken;
}

/** Headers to attach to every API request. Never throws. */
export async function visitHeaders(): Promise<Record<string, string>> {
  try {
    const [visitor, visit] = await Promise.all([getVisitorToken(), getVisitToken()]);
    return { 'Ahoy-Visitor': visitor, 'Ahoy-Visit': visit };
  } catch {
    return {};
  }
}

/**
 * Where this session is running. Ahoy stores these on the visit row (its
 * platform / app_version / os_version columns), so a funnel can be split by
 * OS and by release without a separate device table.
 */
export function deviceContext(): Record<string, string> {
  return {
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? '',
    os_version: String(Platform.Version ?? ''),
  };
}
