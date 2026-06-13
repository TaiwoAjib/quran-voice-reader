# Qur'an Voice Reader 🕌

A mobile Qur'an reading companion built with **Expo / React Native**. It recites
verses in a clear **standard Arabic voice (ar-SA)**, follows along word-by-word with
translation and transliteration, supports hands-free voice commands, and lets you
record and play back your own recitation practice. The interface uses a traditional
Arabian visual language — emerald, gold, and warm sand, with eight-point star
(*khatam*) motifs and naskh-style Arabic typography.

> 📦 **Shipping to the stores?** See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full
> testing, building, and deploying guide (Android **and** iOS, via EAS).

---

## Features

- 🎙️ **Authentic melodic recitation** — streams real verse-by-verse audio from renowned reciters (Alafasy, Abdul Basit, Al-Husary, Al-Minshawi, Al-Sudais, Al-Ghamdi). Falls back to the device's standard Arabic (ar-SA) voice when offline. English translation playback and an Arabic-then-English "Both" mode included.
- 📖 **Word-by-word highlighting** with translation and transliteration toggles.
- 🗣️ **Voice commands** — "next ayah", "pause", "repeat", "go to next surah", and surah/verse navigation.
- 🎧 **Practice mode** — record your own recitation and play it back.
- 🔖 **Bookmarks** and **resume where you left off**.
- 👤 **Multiple reader profiles**.
- 🌙 **Day / night mode** and adjustable reading speed & font size.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| [Node.js](https://nodejs.org/) | 18 LTS or newer | Includes `npm` |
| [Expo CLI](https://docs.expo.dev/) | bundled (`npx expo`) | No global install required |
| **Expo Go** app | latest | On your phone, for quick testing — [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779) |
| JDK 17 | only for local APK builds | e.g. Eclipse Adoptium |
| Android SDK | only for local APK builds | via Android Studio |

> **Note:** Voice recognition, the microphone, and text-to-speech require a **physical device** or a fully configured emulator with audio. They do not work in the web preview.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start the Metro dev server
npm start
```

Then open the app one of these ways:

- **On your phone (easiest):** scan the QR code shown in the terminal with the **Expo Go** app.
- **Android emulator:** press `a` in the Metro terminal (or `npm run android`).
- **iOS simulator (macOS only):** press `i` (or `npm run ios`).
- **Web preview:** press `w` (or `npm run web`) — note that voice/audio features are unavailable here.

---

## Available scripts

| Command | What it does |
|---------|--------------|
| `npm start` | Start the Expo/Metro dev server |
| `npm run android` | Build & launch on a connected Android device/emulator |
| `npm run ios` | Build & launch on the iOS simulator (macOS only) |
| `npm run web` | Run in the browser (no audio/voice) |
| `npm run prebuild` | Regenerate the native `android/` & `ios/` projects |
| `npm run build:apk` | Local release APK via prebuild + Gradle (Windows paths) |
| `npm run build:apk:eas` | Cloud APK via EAS (`preview` profile) |
| `npm run build:apk:local` | Local APK via EAS build runner |

---

## Building a release APK (Android)

### Option A — Helper script (Windows)

A convenience script is included that auto-detects a JDK 17 (including the one
Android Studio bundles), disables the New Architecture, runs Gradle, and copies the
result to `build\quran-voice-reader.apk`:

```bat
build_apk.bat
```

> Requires a JDK 17 and the Android SDK installed. If auto-detection fails, set
> `JAVA_HOME` to your JDK 17 before running, and ensure `android\local.properties`
> `sdk.dir` points to your Android SDK.

### Option B — EAS Build (cloud, no local Android SDK needed)

```bash
npm install -g eas-cli   # once
eas login
npm run build:apk:eas    # uses the "preview" profile in eas.json
```

### Option C — Manual Gradle

```bash
npx expo prebuild --clean
cd android
./gradlew assembleRelease
# APK output: android/app/build/outputs/apk/release/app-release.apk
```

---

## Project structure

```
App.js                      # Navigation root; gates onboarding on first launch
app.json                    # Expo config (icons, splash, permissions)
eas.json                    # EAS build profiles
src/
├── components/
│   └── Ornaments.js        # Star badge, ornate divider, arch frieze, Arabic font
├── context/
│   └── AppContext.js       # Global state + theme palette (AsyncStorage-backed)
├── data/
│   ├── quran.json          # All 114 surahs with verses, translation, words
│   └── quranData.js        # Surah accessors, training sentences, voice commands
├── hooks/
│   ├── useTTS.js           # Standard-Arabic text-to-speech engine
│   ├── useVoiceCommands.js # Speech-recognition command matching
│   └── useVoiceRecorder.js # Audio recording & playback
└── screens/
    ├── OnboardingScreen.js
    ├── SurahSelectionScreen.js
    ├── RecitationScreen.js
    ├── VoiceSettingsScreen.js
    ├── BookmarksScreen.js
    ├── ProfilesScreen.js
    ├── SubscriptionScreen.js   # Optional donations via PayPal
    └── MainTabNavigator.js
```

---

## Permissions

The app requests **microphone** access (and speech recognition on iOS) for voice
commands and recitation practice. These prompts appear the first time you use a
voice feature. The app functions for reading and listening even if you decline them.

---

## Troubleshooting

- **"Metro can't find a module" / stale cache** — restart with `npx expo start -c` to clear the cache.
- **No voice / silent recitation** — reciter audio streams over the internet, so check your connection (verses are fetched from `everyayah.com`). For the offline fallback voice, make sure a Text-to-Speech engine with an Arabic voice is installed (on Android: *Settings → Accessibility → Text-to-speech* → install Google TTS Arabic voice data). Also confirm you're on a real device with the volume up.
- **Voice commands not responding** — confirm microphone permission is granted and "Voice Commands" is toggled on in the Recitation screen.
- **Gradle build fails on Windows** — verify JDK 17 is installed and `JAVA_HOME` in `build_apk.bat` points to it.

---

## Notes

- The donation screen processes **real PayPal payments** via PayPal Smart Buttons (client-side, no backend). Only the PayPal **Client ID** is in the app (`src/config/paypal.js`) — it's public by design. The PayPal **Secret key is never embedded** in the app; keep it server-side only.
- Surah At-Tawbah (9) correctly omits the Basmala; Al-Fatihah (1) includes it as verse 1.
