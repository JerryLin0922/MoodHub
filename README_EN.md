# MoodHub

A local-first mental health companion and health data journal. All data stays on your device — nothing is uploaded to any server.

> Disclaimer: MoodHub is a self-tracking tool. It does not provide medical diagnosis, treatment, or prescription. If you are in a mental health crisis, please contact professional resources first (China national psychological assistance hotline 12356, or emergency 110 / 120).

## Features

- **Overview**: last 14 days of sleep / mood charts plus a metrics table (sleep, resting heart rate, HRV, stress, steps)
- **Diary**: log daily mood (1-5), stress, sleep quality, and notes; re-logging on the same day overwrites
- **Import**: CSV / JSON health data import (recognizes sleep duration, sleep efficiency, resting heart rate, heart rate, HRV, blood oxygen, stress, steps, exercise minutes), with manual entry support
- **Tree Hole**: local rule-engine based empathetic replies; when a crisis signal is detected, it immediately shows a help-resources card and does not call AI
- **AI replies (optional)**: connect to DeepSeek / Qwen / Tencent Hunyuan / Gemini / OpenAI / any custom compatible endpoint; API key can be persisted or kept session-only
- **Self-assessment scales**: PHQ-9 / GAD-7 self-rating (built-in, can be enabled in code)

## Tech Stack

- React 18 + TypeScript 5 + Vite 7
- Tailwind CSS 3 + recharts
- Electron (Windows / macOS / Linux desktop)
- Capacitor 6 (Android / iOS mobile)

## Local Development

```bash
npm install
npm run dev       # http://localhost:5173
```

## Build Verification

```bash
npm run build     # tsc --noEmit type check + vite production build, output in dist/
```

## Multi-Platform Packaging

### Web (deployable to any static hosting / GitHub Pages)

```bash
npm run build
```

### Desktop (Windows / macOS / Linux)

```bash
# Linux / macOS
bash pack.sh

# Windows PowerShell
.\pack.ps1
```

Artifacts are output to `release/` (NSIS installer / portable / dmg / AppImage / deb).

### Android / iOS (Capacitor)

Prerequisites: Node.js, Android Studio (Android), Xcode (macOS + iOS).

```bash
npm run build
npx cap add android     # first time only
npx cap add ios
npx cap sync            # sync web assets into the native projects
npx cap open android    # build APK / AAB in Android Studio
npx cap open ios        # build IPA in Xcode
```

### HarmonyOS / OpenHarmony

Capacitor does not officially support HarmonyOS native projects. Options:

1. Use the PWA / Web build in a HarmonyOS browser (zero modification);
2. Integrate `dist/` as H5 assets into a HarmonyOS Web container (requires a custom native shell);
3. Watch for community adapters (e.g., OpenHarmony Web container wrappers) — there is currently no official one-click solution.

## Data & Privacy

- All data is stored locally via browser localStorage / sessionStorage
- Fully offline when AI is disabled; when enabled, only the last 8 Tree Hole messages are sent to the model provider you choose
- API key is optionally persisted (localStorage) or kept session-only (sessionStorage) and can be cleared anytime
- No accounts, no telemetry, no third-party analytics SDKs

## Publish to GitHub

The repo includes `.gitignore` and a GitHub Actions release workflow (`.github/workflows/release.yml`). Tagging a version triggers multi-platform builds:

```bash
git init
git add .
git commit -m "feat: MoodHub v0.2.0"
git remote add origin https://github.com/<your-username>/moodhub.git
git push -u origin main
git tag v0.2.0
git push origin v0.2.0
```

Installer artifacts for Windows / macOS / Linux then appear on the Releases page.

## Directory Structure

```
moodhub/
├── src/
│   ├── core/            # types, parsing, aggregation, rule engine, scales, utils
│   ├── data/            # local storage, AI providers, AI calls, data API
│   ├── store/           # React Context global state
│   ├── components/      # page components (Overview/Diary/Import/TreeHole/Settings/ScalePanel)
│   ├── App.tsx          # entry & tab routing
│   └── main.tsx
├── electron/            # Electron shell & packaging config
├── capacitor.config.ts  # Capacitor config
├── pack.sh / pack.ps1   # desktop packaging scripts
└── .github/workflows/   # CI release workflow
```

## License

MIT
