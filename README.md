# mobile-app-starter

Expo (React Native) starter that pairs with the `rails-ai-starter` JSON API. Clone, rename, point at your Rails backend, and start building.

> Working on both repos at once? Run `claude` from the parent directory — see `../CLAUDE.md` for the cross-cutting picture (auth contract, etc.).

## Stack

- Expo (file-based routing via `expo-router`)
- TypeScript
- Auth: token-based, talks to the Rails API at `/api/v1/*`

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

## Project layout

```
src/
  app/                 # expo-router file-based routes
    (auth)/            # public screens — sign-in, sign-up
    (authed)/          # screens that require a signed-in user
    _layout.tsx        # root layout, wraps everything in <AuthProvider>
  contexts/auth.tsx    # auth state + signIn / signUp / signOut
  lib/api.ts           # fetch wrapper, adds x-api-token header
  lib/auth-storage.ts  # secure token persistence
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

## Running on a device

Expo Go on a physical phone can't reach `localhost` on your Mac — that resolves to the phone itself. Set `EXPO_PUBLIC_API_URL` to your Mac's LAN IP (e.g. `http://192.168.1.42:3000`) and make sure your firewall allows inbound on that port.

Rails has CORS open in development (`config/initializers/cors.rb`). Native iOS/Android don't enforce CORS, but Expo web does — so the same `EXPO_PUBLIC_API_URL` works across all targets.

## Renaming for a new project

When you fork this as the basis for a real app, the following references will need updating:

- `package.json` → `name`
- `app.json` → `expo.name`, `expo.slug`, `expo.scheme`
- This `README.md` title

## Working with Claude Code

- The version-pinned Expo docs live at https://docs.expo.dev/versions/v56.0.0/ — Expo APIs change frequently, so check those before writing code that touches Expo internals.
- Repo-specific instructions for Claude are in `AGENTS.md` and `CLAUDE.md`.
