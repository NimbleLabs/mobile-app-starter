# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## House rules

### Styling

- Use tokens. `useTheme()` for colors, `Spacing` / `Radii` / `Shadows` / `FontWeightFamily` from `@/constants/theme`.
- Use `<ThemedText>` / `<ThemedView>` and the primitives in `@/components/ui` (`Button`, `Card`, `TextField`, `Screen`, `Section`, `Collapsible`) before writing a new component.
- Never hard-code a hex value, an ad-hoc font size, or a magic padding number in a screen. Need a value that doesn't exist? Add a token to `src/constants/theme.ts` and use it.
- Weights are families, not numbers: `fontFamily: FontWeightFamily.bold`, never `fontWeight: '700'`. React Native does not synthesize weights for custom fonts. Headings use `DisplayFontFamily`.
- Buttons, cards and inputs take `Radii.control` / `Radii.card` / `Radii.field`, which follow the configured corner style.
- Brand strings (`appName`, `markText`, `tagline`) come from `@/constants/branding` — never inline the app name.
- `src/constants/branding.ts` is generated from the Rails app's `config/app.yml` (name, fonts, primary and secondary colors, corners) by `bin/sync-mobile-theme` in rails-ai-starter. Don't edit it by hand: change the theme on the Rails admin's Theme page or in that file, then rerun the script. It also installs the `@expo-google-fonts` packages the fonts need.

### Dark mode

- The app follows the iPhone's Light/Dark setting and switches live, with no relaunch (`userInterfaceStyle: "automatic"` in app.json). Every screen ships working in both.
- There's no in-app appearance switch, on purpose: Apple's HIG says to respect the system-wide setting, not offer an app-specific one. Don't add one unless asked.
- Colors come from `useTheme()` during render. Never put `Colors.light.*` / `Colors.dark.*` in a `StyleSheet.create` — it won't change with the scheme. Stylesheets hold layout; colors go inline: `style={[styles.row, { borderColor: theme.border }]}`.
- A new color token gets a light and a dark value in `Colors` (`src/constants/theme.ts`). Dark isn't an inversion: surfaces get lighter as they rise (`background` → `surface` → `backgroundElement`), and accents sit a step brighter for contrast.
- Need the scheme itself, say to pick an image? `useColorScheme()` from `@/hooks/use-color-scheme`, which returns `'light' | 'dark'`. Not react-native's: it can also return `'unspecified'` or null.
- Shadows barely show on dark backgrounds. Separate surfaces with `surface` and a `border`, as `Card` does, not with a shadow alone.
- Icons: SF Symbols (`expo-symbols`) or template images, tinted with a theme color, so they flip. Full-color art that only works on one background: choose it per scheme.
- iOS handles the rest: the status bar, the keyboard, `Alert`s and the tab bar's glass all follow the system. Don't set `keyboardAppearance` or an app-wide `<StatusBar style>`.
- Launch: expo-splash-screen's `backgroundColor` and `dark.backgroundColor` in app.json must equal `SplashColors` in `theme.ts`. The root layout's overlay starts in that color and fades into the app, so a mismatch is a flash on every launch. `bin/sync-mobile-theme` doesn't touch app.json; after a rebrand, update the light splash color by hand.
- The iOS icon (`assets/expo.icon`) is an Icon Composer file; iOS draws its dark and tinted versions from it. Replace it with another `.icon`, not a flat PNG, or the home screen loses them.

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

### End-to-end tests (Maestro)

- Flows live in `maestro/flows/`. Read `maestro/README.md` before writing one; it lists the traps.
- Give every button and input a flow touches a `testID`, and select by `id:`.
- Changing a screen a flow covers means updating the flow in the same change.
- New user-facing features get a flow.

### Before finishing

- Run `npx tsc --noEmit`. It must pass.
- If you changed a screen, run `npm run e2e` (or the flows that touch it). Every flow must pass.
- If you changed a screen, look at it in dark mode as well as light: with the app open in the simulator, Cmd-Shift-A toggles the appearance (or `xcrun simctl ui <udid> appearance dark`). It must switch without a reload.
