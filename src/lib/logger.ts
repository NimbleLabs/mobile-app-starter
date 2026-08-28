/**
 * Error reporting to the Rails backend's internal Logs system.
 *
 * POLICY — this is NOT a console.log sink. Report only:
 *   (a) unhandled / fatal errors — installed automatically by
 *       `installErrorReporting()` in the root layout, and
 *   (b) explicit, deliberate `reportError()` calls at points where a failure
 *       means a real bug or a user is genuinely stuck.
 *
 * Do NOT report expected failures: a 401 on boot (expired token), the network
 * being offline, validation errors, a cancelled sign-out, a user typing a
 * wrong password. Every report costs an admin's attention; a noisy log is a
 * log nobody reads.
 *
 * Mechanics:
 *  - POSTs `{ log: { level, message, error_class, backtrace, source, context } }`
 *    to `POST /api/v1/logs` with RAW fetch — deliberately not via `api.post`,
 *    so that an outage in the API wrapper can't recurse into more reports.
 *  - Sends `x-api-token` when a token is stored so the log attaches to a user.
 *  - Dedupes: the same `error_class:message` is sent at most once per 60s, and
 *    at most 20 reports leave the device per app session.
 *  - Never throws. Failures are swallowed (logged to the console in __DEV__).
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { getToken } from './auth-storage';
import { deviceContext } from './visit';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type LogLevel = 'warn' | 'error' | 'fatal';

export type ReportOptions = {
  /** Severity. Defaults to 'error'. */
  level?: LogLevel;
  /** Anything that helps an admin reproduce: screen, ids, phase. Keep it small. */
  context?: Record<string, unknown>;
  /** Override the message (defaults to the error's own message). */
  message?: string;
};

/** Same error_class:message is dropped if seen within this window. */
const DEDUPE_WINDOW_MS = 60 * 1000;
/** Hard cap on reports per app session. */
const MAX_REPORTS_PER_SESSION = 20;

const lastSentAt = new Map<string, number>();
let sentThisSession = 0;

function describe(error: unknown): { error_class: string; message: string; backtrace?: string } {
  if (error instanceof Error) {
    return {
      error_class: error.name || error.constructor?.name || 'Error',
      message: error.message || String(error),
      backtrace: error.stack,
    };
  }
  if (typeof error === 'string') return { error_class: 'Error', message: error };
  let message: string;
  try {
    message = JSON.stringify(error);
  } catch {
    message = String(error);
  }
  return { error_class: 'NonError', message };
}

function devWarn(...args: unknown[]) {
  if (__DEV__) console.warn('[logger]', ...args);
}

/**
 * Report a genuine bug to the internal Logs system. Fire-and-forget; safe to
 * call from anywhere (including catch blocks and the global error handler).
 */
export function reportError(error: unknown, opts: ReportOptions = {}): void {
  try {
    const { error_class, message: rawMessage, backtrace } = describe(error);
    const message = opts.message ?? rawMessage;
    const key = `${error_class}:${message}`;
    const now = Date.now();

    if (sentThisSession >= MAX_REPORTS_PER_SESSION) {
      devWarn('session report cap reached; dropping', key);
      return;
    }
    const last = lastSentAt.get(key);
    if (last !== undefined && now - last < DEDUPE_WINDOW_MS) {
      devWarn('duplicate within window; dropping', key);
      return;
    }
    lastSentAt.set(key, now);
    sentThisSession += 1;

    const body = {
      log: {
        level: opts.level ?? 'error',
        message,
        error_class,
        backtrace,
        source: 'mobile' as const,
        context: {
          ...deviceContext(),
          appVersion: Constants.expoConfig?.version ?? '',
          platform: Platform.OS,
          ...opts.context,
        },
      },
    };

    void send(body);
  } catch (e) {
    devWarn('reportError failed', e);
  }
}

async function send(body: unknown): Promise<void> {
  try {
    const token = await getToken().catch(() => null);
    const res = await fetch(`${BASE_URL}/api/v1/logs`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { 'x-api-token': token } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) devWarn('log rejected', res.status);
  } catch (e) {
    devWarn('log send failed', e);
  }
}

type GlobalErrorHandler = (error: unknown, isFatal?: boolean) => void;
type RNErrorUtils = {
  getGlobalHandler: () => GlobalErrorHandler | undefined;
  setGlobalHandler: (handler: GlobalErrorHandler) => void;
};

let installed = false;

/**
 * Hook unhandled errors so they reach the Logs system. Idempotent — calling
 * it twice is a no-op. Native: wraps React Native's global ErrorUtils handler
 * (and still calls the previous one, so the red box / crash behaviour is
 * unchanged). Web: listens for `error` and `unhandledrejection`.
 */
export function installErrorReporting(): void {
  if (installed) return;
  installed = true;

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    window.addEventListener('error', (event) => {
      reportError(event.error ?? event.message, {
        level: 'error',
        context: { unhandled: true },
      });
    });
    window.addEventListener('unhandledrejection', (event) => {
      reportError(event.reason, {
        level: 'error',
        context: { unhandled: true, rejection: true },
      });
    });
    return;
  }

  const errorUtils = (globalThis as { ErrorUtils?: RNErrorUtils }).ErrorUtils;
  if (!errorUtils?.setGlobalHandler) return;

  const previous = errorUtils.getGlobalHandler?.();
  errorUtils.setGlobalHandler((error, isFatal) => {
    reportError(error, {
      level: isFatal ? 'fatal' : 'error',
      context: { unhandled: true },
    });
    previous?.(error, isFatal);
  });
}
