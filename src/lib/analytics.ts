/**
 * Analytics (Ahoy).
 *
 * Analytics is Ahoy on the Rails side. Almost everything worth counting is
 * recorded server-side, at the point it actually happened — signing up,
 * signing in, and whatever domain actions your app adds all go through the
 * Rails API, so Rails records them itself. A dropped request or a crash on
 * the way out can't quietly deflate those numbers, and nothing here can
 * inflate them.
 *
 * The client only reports what the server can't see: right now `app_opened`
 * (a launch / return to foreground) and `push_opened` (a notification tap).
 * Those are queued here and flushed in batches to `POST /api/v1/events`,
 * which writes them into the same ahoy_events table as everything else. The
 * server ignores any event name outside its own allow-list, so adding a new
 * client event means adding it on both sides.
 *
 * Every request already carries the Ahoy visitor/visit headers (see ./visit),
 * so client events land on the same visit as the server-recorded ones.
 *
 * Nothing in here throws or blocks: analytics failing is never a reason for
 * the app to misbehave.
 */
import { AppState, type AppStateStatus } from 'react-native';

import { api } from './api';
import { deviceContext } from './visit';

/** Client-reportable events. Must stay in sync with the server allow-list. */
export const APP_OPENED = 'app_opened';
export const PUSH_OPENED = 'push_opened';

type QueuedEvent = {
  name: string;
  properties: Record<string, unknown>;
  time: string;
};

/** Batch window — long enough to coalesce a burst, short enough to survive a kill. */
const FLUSH_DELAY_MS = 2000;
/** Flush immediately once the queue reaches this size. */
const FLUSH_AT = 10;
/** Server's per-request cap. */
const MAX_BATCH = 50;
/** Hard ceiling so a long offline stretch can't grow the queue without bound. */
const MAX_QUEUE = 100;

let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let appStateSubscription: { remove: () => void } | null = null;

/** Queue an event. Returns immediately; the send happens in the background. */
export function track(name: string, properties: Record<string, unknown> = {}): void {
  queue.push({ name, properties, time: new Date().toISOString() });

  // Drop the oldest rather than the newest: recent behaviour is the part worth
  // keeping if we ever get this far behind.
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);

  if (queue.length >= FLUSH_AT) {
    void flush();
  } else if (!timer) {
    timer = setTimeout(() => {
      void flush();
    }, FLUSH_DELAY_MS);
  }
}

/** Send whatever is queued. Safe to call at any time; never rejects. */
export async function flush(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (queue.length === 0) return;

  const batch = queue.slice(0, MAX_BATCH);
  queue = queue.slice(batch.length);

  try {
    await api.post('/api/v1/events', { events: batch, ...deviceContext() });
  } catch {
    // Offline or the server is unhappy — put the batch back in front of
    // anything newer and let the next flush retry it. Still bounded.
    queue = [...batch, ...queue].slice(-MAX_QUEUE);
  }
}

/**
 * Start the background flush. Called once from the root layout: sending on the
 * way to the background is what stops a batch dying with the app.
 */
export function startAnalytics(): () => void {
  appStateSubscription?.remove();

  const onChange = (state: AppStateStatus) => {
    if (state !== 'active') void flush();
  };

  appStateSubscription = AppState.addEventListener('change', onChange);

  return () => {
    appStateSubscription?.remove();
    appStateSubscription = null;
  };
}
