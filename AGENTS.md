# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## House rules

### Styling

- Use tokens. `useTheme()` for colors, `Spacing` / `Radii` / `Shadows` / `FontWeightFamily` from `@/constants/theme`.
- Use `<ThemedText>` / `<ThemedView>` and the primitives in `@/components/ui` (`Button`, `Card`, `TextField`, `Screen`, `Section`, `Collapsible`) before writing a new component.
- Never hard-code a hex value, an ad-hoc font size, or a magic padding number in a screen. Need a value that doesn't exist? Add a token to `src/constants/theme.ts` and use it.
- Weights are families, not numbers: `fontFamily: FontWeightFamily.bold`, never `fontWeight: '700'`. React Native does not synthesize weights for Outfit.
- Brand strings (`appName`, `markText`, `tagline`) come from `@/constants/branding` — never inline the app name.

### Analytics

- Ahoy, via `src/lib/analytics.ts` → `POST /api/v1/events`. Events are rows in the project's Postgres; no third-party SDK.
- Prefer tracking server-side in Rails, where the action actually happens. That's the default answer.
- Add a client event only when the server genuinely cannot observe it (app foregrounded, push tapped).
- Any new client event MUST be added to `Analytics::CLIENT_REPORTABLE` in `rails-ai-starter`. Anything not on that allow-list is dropped silently — no error, no row.
- `track()` never throws and never blocks. Don't await it, don't wrap it in try/catch.

### Errors

- `reportError()` from `src/lib/logger.ts` → `POST /api/v1/logs`, read by a human in the Rails admin at `/admin/logs`. There is no Sentry/Rollbar.
- Report genuine bugs only:
  - DO: a failure that leaves a user stuck or means the code is broken (5xx, malformed response, unexpected throw on a critical path).
  - DON'T: 401 on boot, offline network, validation errors, wrong password, a cancelled sign-out, anything you'd call "expected".
- Unhandled and fatal errors are already captured globally by `installErrorReporting()` in the root layout. Do not wrap code in try/catch just to report it.
- Every report costs an admin's attention. A noisy log is a log nobody reads.

### Before finishing

- Run `npx tsc --noEmit`. It must pass.
