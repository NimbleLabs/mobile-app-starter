#!/usr/bin/env bash
# Runs the Maestro end-to-end flows on the booted iOS simulator, in Expo Go.
#
#   npm run e2e                               # every flow in maestro/flows
#   npm run e2e -- maestro/flows/smoke.yaml   # one flow
#
# Needs: Metro running (npm start) and Expo Go on the simulator for this
# project's Expo SDK. flows/auth.yaml also needs the Rails API at
# EXPO_PUBLIC_API_URL. See maestro/README.md.
set -euo pipefail
cd "$(dirname "$0")/.."

# Maestro runs on the JVM. Homebrew's openjdk isn't linked onto the PATH by
# default, so look for it before giving up.
if ! java -version >/dev/null 2>&1; then
  for home in /opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home \
              /usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home; do
    if [ -x "$home/bin/java" ]; then
      export JAVA_HOME="$home" PATH="$home/bin:$PATH"
      break
    fi
  done
fi
java -version >/dev/null 2>&1 || { echo "Maestro needs Java: brew install openjdk"; exit 1; }
command -v maestro >/dev/null || { echo "Install Maestro: brew install maestro"; exit 1; }

METRO_PORT="${METRO_PORT:-8081}"
curl -sf -o /dev/null "http://localhost:${METRO_PORT}/status" \
  || { echo "Metro isn't running on :${METRO_PORT}. Start it: npm start"; exit 1; }

mkdir -p maestro/screens
if [ "$#" -eq 0 ]; then set -- maestro/flows; fi
maestro test -e METRO_URL="exp://127.0.0.1:${METRO_PORT}" "$@"
