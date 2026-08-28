# mobile-app-starter

Expo (React Native) starter that pairs with the `rails-ai-starter` JSON API. Clone, rename, point at your Rails backend, and start building.

> Working on both repos at once? Run `claude` from the parent directory — see `../CLAUDE.md` for the cross-cutting picture (auth contract, etc.).

## Stack

- Expo (file-based routing via `expo-router`)
- TypeScript
- Auth: token-based, talks to the Rails API at `/api/v1/*`
- Design tokens + `ui` primitives, Outfit as the brand typeface
- Analytics via Ahoy, error reporting into the backend's own Logs table

## Setup

```bash
npm install
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_API_URL to where Rails is running.
# Simulators can use http://localhost:3000, but a physical device
# needs your Mac's LAN IP, e.g. http://192.168.1.42:3000.
npx expo start
```

Make sure the Rails backend is running:

```bash
cd ../rails-ai-starter && bin/dev   # http://localhost:3000
```

`EXPO_PUBLIC_API_URL` is the only required env var, and analytics and error reporting reuse it — `src/lib/api.ts` and `src/lib/logger.ts` both read it (falling back to `http://localhost:3000`), so if it points at nothing, events and logs quietly go nowhere.

## Project layout

```
src/
  app/                      # expo-router file-based routes
    _layout.tsx             # root: loads Outfit, <AuthProvider>, nav theme,
                            #   startAnalytics() + installErrorReporting()
    (auth)/                 # public screens
      _layout.tsx           #   redirects signed-in users out
      sign-in.tsx
      sign-up.tsx
    (authed)/               # screens that require a signed-in user
      _layout.tsx           #   redirects signed-out users to /sign-in
      index.tsx             #   Home tab
      profile.tsx           #   Profile tab (sign out, app info)
  components/
    ui/                     # design-system primitives (Button, Card, …)
    themed-text.tsx         # <ThemedText> — typography scale + theme colors
    themed-view.tsx         # <ThemedView> — themed background surfaces
    brand-mark.tsx          # <BrandMark> — rounded tile + Branding.markText
    animated-icon.tsx       # animated splash / hero mark (+ .web variant)
    app-tabs.tsx            # native tab bar (+ .web variant, top bar)
    external-link.tsx
  constants/
    theme.ts                # design tokens (Colors, Brand, Spacing, Radii, …)
    branding.ts             # appName / markText / tagline
  contexts/auth.tsx         # auth state + signIn / signUp / signOut
  hooks/
    use-theme.ts            # useTheme() → the active Colors scheme
    use-color-scheme.ts     # (+ .web variant)
  lib/
    api.ts                  # fetch wrapper: x-api-token + Ahoy headers
    auth-storage.ts         # secure token persistence
    analytics.ts            # track() / flush() → POST /api/v1/events
    visit.ts                # Ahoy visitor + visit tokens
    logger.ts               # reportError() → POST /api/v1/logs
  global.css                # web-only CSS font variables
types/expo-env.d.ts         # committed Expo ambient types so tsc passes on a fresh clone
```

### Route gating

`(auth)` and `(authed)` are Expo Router groups. Their `_layout.tsx` files read `user` from `AuthProvider` and `Redirect` based on signed-in state — so adding a screen under `(authed)/` automatically gets gated. No manual checks needed inside screens.

## Auth contract

The mobile app talks to these Rails endpoints (defined in `rails-ai-starter/config/routes.rb`):

| Method | Path                    | Returns              |
| ------ | ----------------------- | -------------------- |
| POST   | `/api/v1/registrations` | `{ user, token }`    |
| POST   | `/api/v1/sessions`      | `{ user, token }`    |
| DELETE | `/api/v1/sessions`      | `{ ok: true }` (rotates token) |
| GET    | `/api/v1/users/current` | `{ user }`           |

Authenticated requests send `x-api-token: <token>`. The token comes back on sign-in/up, is stored via `expo-secure-store`, and `signOut()` calls `DELETE /api/v1/sessions` so the server-side token is invalidated.

## Design system

All visual constants live in `src/constants/theme.ts`. Screens never hard-code a hex value or an ad-hoc font size — they read tokens.

**Tokens**

- `Colors` — a `light` and a `dark` set with the same keys: `text`, `textSecondary`, `background`, `surface`, `backgroundElement`, `backgroundSelected`, `border`, `primary`, `primaryHover`, `onPrimary`, `success`, `danger`. `ThemeColor` is the union of those keys.
- `Brand` — the raw purple ramp (`50, 100, 200, 500, 600, 700, 900`), independent of scheme. Use it when you need a specific shade (gradients, glows, splash) rather than a semantic role.
- `Spacing` — `half: 2`, `one: 4`, `two: 8`, `three: 16`, `four: 24`, `five: 32`, `six: 64`.
- `Radii` — `sm: 8`, `md: 12`, `lg: 16`, `xl: 24`, `2xl: 32`, `pill: 999`.
- `Shadows` — `card` and `pill`, soft low-opacity elevation presets.
- `FontWeightFamily` — `regular / medium / semibold / bold` mapped to the loaded Outfit families.
- Also: `Fonts` (platform font stacks), `BottomTabInset`, `WebTabBarInset`, `MaxContentWidth`.

**Consuming them**

`useTheme()` (`src/hooks/use-theme.ts`) returns the `Colors` set for the active scheme. `<ThemedText>` and `<ThemedView>` apply text and background colors from that set, and the `ui` primitives build on both.

```tsx
const theme = useTheme();
<View style={[styles.avatar, { backgroundColor: theme.primary }]} />
<ThemedText type="small" themeColor="textSecondary">{user.email}</ThemedText>
```

`<ThemedText>` types: `default`, `title`, `subtitle`, `small`, `smallBold`, `link`, `linkPrimary`, `code`.

**Typography**

Outfit is the brand typeface, loaded in `src/app/_layout.tsx` via `@expo-google-fonts/outfit` (`Outfit_400Regular`, `Outfit_500Medium`, `Outfit_600SemiBold`, `Outfit_700Bold`). The root layout holds the splash until the font is ready so there's no flash of the system font. React Native does not synthesize weights for custom fonts — each weight is a separate loaded family — which is exactly why `FontWeightFamily` exists: set `fontFamily: FontWeightFamily.semibold`, not `fontWeight: '600'`.

**UI primitives** — `src/components/ui/`, all re-exported from `@/components/ui`:

- `Button` — the one button. Variants: `primary` (filled brand), `secondary` (filled, quieter), `outline`, `ghost`, `danger`. Supports `loading` (spinner replaces the label and presses are disabled).
- `Card` — a raised surface: rounded, hairline border, soft shadow, padded, gapped content.
- `TextField` — labeled text input; uppercase eyebrow label, danger-colored border and message when `error` is set.
- `Screen` — standard page wrapper for authed screens: themed background, top safe area, padding that clears the tab bar on every platform, optional pull-to-refresh, centered and capped at `MaxContentWidth`.
- `Section` — an uppercase eyebrow title over a gapped stack of children.
- `Collapsible` — expandable disclosure section.

```tsx
import { Button, Screen, TextField } from '@/components/ui';

<Screen refreshing={refreshing} onRefresh={reload}>
  <TextField
    label="Email"
    placeholder="you@example.com"
    value={email}
    onChangeText={setEmail}
    error={emailError}
  />
  <Button variant="primary" loading={submitting} onPress={handleSubmit}>
    Sign in
  </Button>
</Screen>
```

**One product, two halves.** The palette here is deliberately identical to the Rails admin's in `rails-ai-starter` (`app/assets/tailwind/application.css` — same `#7c3aed` primary, same dark `#141019`). When you re-brand, change both so the API's admin UI and the app still look like one product.

## Analytics (Ahoy)

Ahoy is the analytics tool for these starters. Events are `Ahoy::Event` rows in the project's own Postgres — there is no third-party SDK, no external account, and no data leaving your infrastructure.

**Almost everything is tracked server-side.** Sign-up, sign-in, and whatever domain actions you add all pass through the Rails API, so Rails records them at the point they actually happen. A dropped request or a client crash on the way out can't quietly deflate those numbers, and a client can't inflate them. Reach for a client event only when the server genuinely cannot observe the thing.

The app therefore reports very little. `src/lib/analytics.ts` exports the two event names it is allowed to send:

```ts
export const APP_OPENED = 'app_opened';   // launch / return to foreground
export const PUSH_OPENED = 'push_opened'; // notification tap
```

```ts
import { APP_OPENED, track } from '@/lib/analytics';

track(APP_OPENED);
track(PUSH_OPENED, { notification_id: id });
```

`track(name, properties?)` returns immediately and never throws. Queued events are flushed to `POST /api/v1/events` — after a 2s batch window, immediately once 10 events are queued, and whenever the app leaves the foreground (`startAnalytics()` in the root layout wires up the `AppState` listener, which is what stops a batch dying with the app). A batch is at most 50 events; the queue is capped at 100 and drops the oldest first. A failed flush puts the batch back at the front and retries on the next flush.

**The server enforces an allow-list.** `Analytics::CLIENT_REPORTABLE` in `rails-ai-starter` (`app/services/analytics.rb`) lists exactly the names a client may report, and `Api::V1::EventsController` drops anything else — silently. Adding a client event means adding it in both repos.

**Visit stitching.** `src/lib/visit.ts` mints two tokens and `src/lib/api.ts` attaches them as `Ahoy-Visitor` / `Ahoy-Visit` headers on *every* API request — the same headers Ahoy's own JS tracker sends:

- visitor token: one random UUID per install, persisted forever. Anonymous — never derived from the device or the user.
- visit token: one per session, rotated after 30 minutes of inactivity to match `Ahoy.visit_duration` on the server.

Because they ride along on every request, the events Rails records itself land on the same visit as the ones the app reports — so anonymous activity before sign-in stitches to the user the moment they sign in. `deviceContext()` adds `platform`, `app_version`, and `os_version` so funnels can be split by OS and release.

## Error reporting (internal Logs)

There is no Rollbar and no Sentry. Errors POST to `/api/v1/logs` and become rows in the project's own `Logs` table, visible in the Rails admin at `/admin/logs`, with email/Slack notification rules configured on the Rails side (`LogSubscription`, `LogNotifier`).

### Policy — read this before adding a report

Report only:

1. **Unhandled / fatal errors.** `installErrorReporting()` is called once in the root layout and wires these up for you: on native it wraps React Native's global `ErrorUtils` handler (still calling the previous one, so red-box and crash behaviour are unchanged); on web it listens for `error` and `unhandledrejection`.
2. **Deliberate `reportError()` calls** at points where a failure means a real bug or a user is genuinely stuck. Example from `src/contexts/auth.tsx`: a non-401 failure fetching the current user on boot leaves someone stranded at the splash — worth an admin's attention.

Do **not** report expected failures:

- a 401 on boot (expired or revoked token — just clear it)
- the network being offline
- validation errors, or a user typing a wrong password
- a cancelled sign-out

Every report costs an admin's attention. A noisy log is a log nobody reads.

### Usage

```ts
import { reportError } from '@/lib/logger';

reportError(e, {
  level: 'error',                       // 'warn' | 'error' | 'fatal', default 'error'
  context: { screen: 'profile', id },   // anything that helps reproduce; keep it small
  message: 'Could not load profile',    // optional override of the error's own message
});
```

Mechanics worth knowing:

- **Fire-and-forget and never throws.** Safe to call from a catch block or a global handler. Failures are swallowed (console-warned in `__DEV__`).
- **Deduped locally.** The same `error_class:message` is sent at most once per 60 seconds, and at most 20 reports leave the device per app session.
- **Raw `fetch`, not the `api` helper.** Deliberate: if the API wrapper itself is what's failing, reporting through it would recurse into more reports. It still sends `x-api-token` when a token is stored, so the log attaches to a user.
- **Payload:** `{ log: { level, message, error_class, backtrace, source: 'mobile', context } }`, with `context` automatically including platform, OS version, and app version.
- **Try it:** the Profile screen has a dev-only "Send test error" button (`__DEV__` only) that fires a `warn`-level report — a quick way to confirm the whole path works end to end.

## Running on a device

Expo Go on a physical phone can't reach `localhost` on your Mac — that resolves to the phone itself. Set `EXPO_PUBLIC_API_URL` to your Mac's LAN IP (e.g. `http://192.168.1.42:3000`) and make sure your firewall allows inbound on that port.

Rails has CORS open in development (`config/initializers/cors.rb`). Native iOS/Android don't enforce CORS, but Expo web does — so the same `EXPO_PUBLIC_API_URL` works across all targets.

## Renaming for a new project

When you fork this as the basis for a real app, the following references will need updating:

- `src/constants/branding.ts` → `appName`, `markText`, `tagline` — start here. These three strings drive the brand mark, the web tab bar label, and the auth screens' copy.
- `package.json` → `name`
- `app.json` → `expo.name`, `expo.slug`, `expo.scheme`
- This `README.md` title

Re-branding the palette as well? Change `primary` / `primaryHover` in both schemes and the `Brand` ramp in `src/constants/theme.ts`, then the colors baked into `app.json` — `expo.plugins` → `expo-splash-screen` `backgroundColor` (and its `dark.backgroundColor`) and `expo.android.adaptiveIcon.backgroundColor`. Keep them in step with the Rails admin's palette.

## Working with Claude Code

- The version-pinned Expo docs live at https://docs.expo.dev/versions/v56.0.0/ — Expo APIs change frequently, so check those before writing code that touches Expo internals.
- Repo-specific instructions for Claude are in `AGENTS.md` and `CLAUDE.md`.
