# Deployment, Testing & Build Guide — Qur'an Voice Reader

This guide covers **testing**, **building**, and **deploying** the app to **Android**
and **iOS** using [Expo Application Services (EAS)](https://docs.expo.dev/eas/).

> For day-to-day local development, see [README.md](README.md). This document is
> for producing installable builds and shipping to the app stores.

- **Repo:** https://github.com/TaiwoAjib/quran-voice-reader
- **App name / slug:** `Qur'an Voice Reader` / `quran-voice-reader`
- **Bundle id (iOS) / package (Android):** `com.quranvoicereader`

---

## 1. Accounts & tooling you'll need

| For | Requirement | Cost |
|-----|-------------|------|
| Any EAS build | [Expo account](https://expo.dev/signup) | Free |
| Android testing | A device or emulator | Free |
| iOS testing (simulator) | A **Mac** with Xcode | Free |
| iOS testing on a real device | Apple ID (free) or Apple Developer | Free / paid |
| **Publishing to Google Play** | [Google Play Console](https://play.google.com/console) account | $25 once |
| **Publishing to the App Store** | [Apple Developer Program](https://developer.apple.com/programs/) | $99/year |

Install the toolchain (already added as a dev dependency in this repo):

```bash
npm install                 # installs eas-cli locally
npx eas login               # log in to your Expo account
npx eas whoami              # confirm you're logged in
```

> You do **not** need Android Studio or Xcode to build with EAS — builds run in
> Expo's cloud. You only need Xcode/Android Studio for **local** builds or running
> the platform simulators/emulators.

---

## 2. First-time project setup

The first cloud build links this project to your Expo account and writes an
`extra.eas.projectId` into `app.json`. Run it **interactively** once:

```bash
npx eas build:configure        # links the project (creates the EAS project)
```

Commit the resulting `app.json` change so future builds (and CI) are linked:

```bash
git add app.json && git commit -m "chore: link EAS project"
```

---

## 3. Testing

### 3a. Quick test in Expo Go (no build)
```bash
npm start          # then scan the QR with Expo Go, or press a / i / w
```
Good for UI work. **Note:** the on-device voice search and microphone features need
a **development build** or a real device — they don't run in Expo Go reliably.

### 3b. Development build (recommended for full testing)
A dev build includes the native modules (voice recognition, audio) plus fast refresh.

```bash
# Android dev build (APK with dev client)
npx eas build --platform android --profile development

# iOS dev build for the Simulator (requires a Mac)
npx eas build --platform ios --profile development
```
Install the resulting artifact, then start the bundler with `npx expo start --dev-client`.

### 3c. Platform simulators/emulators
- **Android emulator:** start it from Android Studio, then `npm run android`.
- **iOS Simulator (Mac only):** `npm run ios`.

---

## 4. Building Android

### Option A — EAS cloud (recommended, no local SDK needed)
```bash
# Internal-test APK (installable directly on a device)
npx eas build --platform android --profile preview

# Production Android App Bundle (.aab) for Google Play
npx eas build --platform android --profile production
```
- `preview` → `.apk` you can sideload (the `build:apk:eas` npm script does this).
- `production` → `.aab` for Play Store upload, with `autoIncrement` bumping `versionCode`.
- After the build finishes, EAS prints a **download URL**. To save the APK into the
  local `build/` folder:
  ```bash
  npx eas build:download --platform android --output build/quran-voice-reader.apk
  ```

### Option B — Local build (needs Android Studio / JDK 17 + Android SDK)
```bash
build_apk.bat        # Windows: auto-detects JDK, builds, copies to build\quran-voice-reader.apk
```
or manually:
```bash
npx expo prebuild --clean
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

> The committed `android/` folder is gitignored, so EAS regenerates native code via
> **prebuild** — the speech-recognition config plugin (`plugins/withAndroidSpeechQueries.js`)
> and `@react-native-voice/voice` plugin in `app.json` are applied automatically on
> the cloud. For **local** builds the equivalent fix lives in the committed
> `android/app/src/main/AndroidManifest.xml`.

---

## 5. Building iOS

> iOS builds require a **Mac only for local builds and the Simulator**. EAS cloud
> builds run on Expo's macOS workers, so you can trigger them from Windows too.

```bash
# Simulator build (no Apple Developer account needed) — great for testing on a Mac
npx eas build --platform ios --profile preview

# Production build (.ipa) for TestFlight / App Store — needs Apple Developer account
npx eas build --platform ios --profile production
```
- The first production iOS build will prompt to sign in with your Apple Developer
  account and will **auto-manage signing** (certificates & provisioning profiles) for
  you — let EAS handle it unless you have existing credentials.
- `production` uses `autoIncrement` to bump the iOS `buildNumber`.

### Local iOS build (Mac only)
```bash
npx expo prebuild --clean
npx expo run:ios --configuration Release
```

---

## 6. Submitting to the stores

```bash
# Google Play (uploads the latest production .aab)
npx eas submit --platform android --profile production --latest

# Apple App Store / TestFlight (uploads the latest production .ipa)
npx eas submit --platform ios --profile production --latest
```
- **Android:** create the app in the Play Console first, and provide a Google service
  account key (EAS will guide you, or set it under `submit.production.android` in `eas.json`).
- **iOS:** EAS uploads to App Store Connect; from there submit for TestFlight or review.
- You can also build + submit in one step: `npx eas build ... --auto-submit`.

---

## 7. Over-the-air (OTA) JS updates

For JS/asset-only changes (no native code), push instant updates without a new store build:

```bash
npx expo install expo-updates    # once, if not already installed
npx eas update --branch production --message "Fix typo in surah list"
```
Native changes (new permissions, new native modules, manifest/plist edits) still
require a fresh store build.

---

## 8. Versioning & release checklist

Bump `expo.version` in `app.json` for every user-facing release (e.g. `1.0.0` → `1.0.1`).
`versionCode` (Android) and `buildNumber` (iOS) auto-increment in the `production`
profile.

Before each release:
- [ ] `npm install` is clean and the app runs (`npm start`)
- [ ] Bump `expo.version` in `app.json`
- [ ] Verify a `preview` build installs and the **voice search**, **recitation audio**,
      **bookmarks**, and **night mode** all work
- [ ] Commit & push to `main`
- [ ] `eas build --profile production` for the target platform(s)
- [ ] `eas submit` and complete store listing (screenshots, description, privacy policy)

---

## 9. (Optional) CI/CD with GitHub Actions

Automate cloud builds on push using your repo
(`https://github.com/TaiwoAjib/quran-voice-reader`).

1. Create an **Expo access token**: https://expo.dev/settings/access-tokens
2. Add it to the repo under **Settings → Secrets and variables → Actions** as `EXPO_TOKEN`.
3. Add `.github/workflows/eas-build.yml`:

```yaml
name: EAS Build (Android)
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform android --profile preview --non-interactive --no-wait
```

`--no-wait` queues the build and returns immediately; track it at https://expo.dev.
Add a second job with `--platform ios` once your Apple credentials are configured in EAS.

---

## 10. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `eas` not found | `npm install`, then use `npx eas ...` |
| First build fails "project not configured" | Run `npx eas build:configure` interactively once |
| Android build can't find SDK (local) | Install Android Studio; ensure `android/local.properties` `sdk.dir` points to your SDK |
| iOS build "no bundle identifier" | Confirm `ios.bundleIdentifier` in `app.json` (`com.quranvoicereader`) |
| `EBUSY: resource busy or locked, rmdir 'android'` during prebuild | VS Code / an editor or Android Studio is locking `android/`. Close any open files under `android/` (or close the editor), then retry. The included `.vscode/settings.json` excludes native folders from the watcher to prevent this. Building via **EAS cloud** avoids it entirely (no local prebuild). |
| Voice search button does nothing | It needs a **dev or release build** — voice recognition isn't in Expo Go. In Expo Go the assistant now shows a notice and a "Type a surah instead" fallback. On device it also needs Google speech services + mic permission (the `<queries>` fix ships in this build). |
| Recitation audio silent | Reciter audio streams online — check connectivity; offline it falls back to device TTS |
| Submit fails: missing credentials | For Android add a Play service-account key; for iOS sign in with your Apple Developer account when prompted |
