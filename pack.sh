#!/usr/bin/env bash
# MoodHub packaging script (Linux / macOS).
set -euo pipefail

echo "==> [1/4] Install root dependencies"
npm install

echo "==> [2/4] Type check + build web"
npm run build

echo "==> [3/4] Install Electron builder deps"
cd electron
npm install

echo "==> [4/4] Package desktop app"
case "$(uname -s)" in
  Darwin)
    npx electron-builder --mac dmg zip
    ;;
  *)
    npx electron-builder --linux AppImage deb
    ;;
esac

echo "==> Done. Artifacts in release/"
