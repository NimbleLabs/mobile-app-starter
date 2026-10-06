# End-to-end tests (Maestro)

[Maestro](https://maestro.dev) drives the app on the iOS simulator with
real taps, end to end against the real API.

| Flow | Covers | Needs |
|---|---|---|
| `flows/smoke.yaml` | The app starts; sign-in and sign-up screens | Metro |
| `flows/auth.yaml` | Sign up, sign out, sign back in | Metro + the Rails API |

## Running

```bash
brew install maestro openjdk     # once
npm start                        # Metro, in another terminal
npm run e2e                      # all flows
npm run e2e -- maestro/flows/smoke.yaml
```

`scripts/e2e.sh` finds Homebrew's JDK (Maestro runs on Java), checks Metro
is up, and runs the flows in Expo Go (`appId: host.exp.Exponent`).
Screenshots land in `maestro/screens/` (gitignored). Expo Go on the
simulator has to match this project's Expo SDK.

## When the app moves to a development build

Once a project adds native code Expo Go can't run (Sign in with Apple,
notifications, Face ID…), it runs as a development build with its own
bundle id. Then:

- set `appId` in every flow to the bundle id (e.g. `com.example.app`);
- replace `subflows/open-app.yaml` with one that handles the dev launcher.
  The launcher shows "Open in …?", a dev-menu intro ("Continue") and the dev
  menu (close button id `xmark`) — each only sometimes, so tap each only
  `when: visible`;
- don't use `launchApp: clearState: true`. It wipes the dev build's Metro
  connection. Reset state through your API at the top of each flow instead.

Kindled (`GreatFaith/kindled-mobile/maestro`) is a working example,
including driving two users from one simulator with `runScript` HTTP calls.

## Writing flows: the traps

- **Give everything a flow touches a `testID`**, and select by `id:`.
  Wording changes; test IDs don't.
- **Text selectors are full-match regular expressions.** `"…better?"` won't
  match, because `?` is a regex character. Match part of a string with
  `".*part of it.*"`.
- **A tappable row is one element.** A `Pressable` merges its children's
  text into one label, so `".*Title.*"` finds it, and `"Title"` doesn't.
- **Multi-line inputs have no Done key.** `hideKeyboard` fails; tap the
  field's own label to dismiss the keyboard. Anything lower down may be
  under the keyboard.
- **The floating tab bar covers the bottom of the screen.** Before tapping
  something low on a tab, use `scrollUntilVisible` with
  `centerElement: true`, or the tap lands on a tab.
- **A tap right after a save can be swallowed.** Put
  `waitForAnimationToEnd` before tapping Back after a mutation.
- **iOS puts a narrow no-break space before AM/PM.** Match times with
  `"7:00.PM"`.
- **Text uppercased in code is uppercase on screen.** Match it in capitals.
- **Unique data per run.** `runScript` can set `output.*` (see
  `scripts/new-account.js`), and flows use it as `${output.email}`.
