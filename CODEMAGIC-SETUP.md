# Codemagic CI/CD Setup Guide

Complete setup instructions for automating Android and iOS builds with **Codemagic**.

---

## 📋 What is Codemagic?

[Codemagic](https://codemagic.io) is a cloud CI/CD platform specifically designed for mobile apps. It automatically builds, tests, and publishes your app to Google Play Store and Apple App Store whenever you push code.

**Benefits:**
- ✅ Automated builds (no local setup needed)
- ✅ Builds Android APK/AAB and iOS IPA in parallel
- ✅ Direct publishing to Google Play & App Store
- ✅ Free tier available (10 builds/month)
- ✅ Fast, reliable, mobile-optimized

---

## 🚀 Step 1: Create a Codemagic Account

1. Go to [codemagic.io](https://codemagic.io)
2. Click **Sign Up** → Connect with GitHub
3. Authorize Codemagic to access your repositories
4. Select your `quran-voice-reader` repository

---

## 🔐 Step 2: Set Up Environment Variables

Environment variables store sensitive data (keys, passwords, certificates) securely. Codemagic won't commit them to git.

### In Codemagic Dashboard:

1. **Organization Settings** → **Environment variables**
2. Create groups for each build type:

#### Group: `google_play`
- `ANDROID_KEYSTORE` — Your keystore file (base64-encoded)
- `KEYSTORE_PASSWORD` — Keystore password
- `KEY_ALIAS` — Key alias name
- `KEY_PASSWORD` — Key password
- `PLAY_STORE_CREDENTIALS` — Google Play service account JSON (base64-encoded)

#### Group: `app_store`
- `IOS_CERTIFICATE` — Apple development/distribution certificate (base64-encoded)
- `IOS_CERTIFICATE_PASSWORD` — Certificate password
- `IOS_PROVISIONING_PROFILE` — Provisioning profile (base64-encoded)
- `IOS_PROVISIONING_PROFILE_ID` — Profile UUID
- `IOS_PROVISIONING_PROFILE_NAME` — Profile name
- `DEVELOPMENT_TEAM_ID` — Your Apple Team ID
- `APP_STORE_CONNECT_ISSUER_ID` — Apple App Store Connect Issuer ID
- `APP_STORE_CONNECT_KEY_ID` — API Key ID
- `APP_STORE_CONNECT_PRIVATE_KEY` — API Key (base64-encoded)

#### Group: `eas_credentials`
- `EAS_TOKEN` — Your Expo EAS token (for EAS builds)

### How to Encode Files to Base64

**On macOS/Linux:**
```bash
base64 -i /path/to/file | pbcopy
# Paste into Codemagic UI
```

**On Windows (PowerShell):**
```powershell
$file = [System.IO.File]::ReadAllBytes("C:\path\to\file")
$base64 = [Convert]::ToBase64String($file)
Set-Clipboard -Value $base64
# Paste into Codemagic UI
```

**Online tool (if needed):**
- [base64encode.org](https://www.base64encode.org) — Upload file, copy output

---

## 📱 Step 3: Configure Android Signing

### Prepare Your Keystore

If you don't have a keystore yet:

```bash
keytool -genkey -v -keystore upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias quran-voice-reader \
  -storepass your_password \
  -keypass your_password \
  -dname "CN=Ajibode Taiwo,O=Individual,C=NG"
```

Store this file securely (not in git). You'll need:
- Keystore file (`upload-keystore.jks`)
- Store password
- Key alias (e.g., `quran-voice-reader`)
- Key password

### Encode and Upload to Codemagic

```bash
# Base64 encode your keystore
base64 -i upload-keystore.jks | pbcopy

# In Codemagic UI:
# 1. Go to Environment variables → google_play group
# 2. Add ANDROID_KEYSTORE = (paste the base64 output)
# 3. Add other password/alias fields
```

### Add Google Play Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a service account with **Editor** permissions for Play Store
3. Download the JSON key file
4. Base64-encode it and add to Codemagic as `PLAY_STORE_CREDENTIALS`

---

## 🍎 Step 4: Configure iOS Signing

### Prepare Certificate & Provisioning Profile

1. **In Apple Developer Account:**
   - Go to [developer.apple.com/account](https://developer.apple.com/account)
   - **Certificates, Identifiers & Profiles** → Create/export:
     - Distribution Certificate (.cer or .p12)
     - Provisioning Profile (.mobileprovision)

2. **Create App Store Connect API Key:**
   - **Users and Access** → **Keys**
   - Create a new key with **App Manager** access
   - Download the key file

3. **Encode and Upload to Codemagic:**
   ```bash
   # Certificate
   base64 -i ios_certificate.p12 | pbcopy
   # → CODEMAGIC: IOS_CERTIFICATE (in app_store group)
   
   # Provisioning Profile
   base64 -i ios_profile.mobileprovision | pbcopy
   # → CODEMAGIC: IOS_PROVISIONING_PROFILE
   
   # App Store Connect API Key
   base64 -i AuthKey_*.p8 | pbcopy
   # → CODEMAGIC: APP_STORE_CONNECT_PRIVATE_KEY
   ```

4. **Get your Team ID:**
   - Apple Developer Account → **Membership**
   - Copy your **Team ID**
   - → CODEMAGIC: `DEVELOPMENT_TEAM_ID`

5. **Get App Store Connect Credentials:**
   - In the API Key download, note the Key ID and Issuer ID
   - → CODEMAGIC: `APP_STORE_CONNECT_KEY_ID` and `APP_STORE_CONNECT_ISSUER_ID`

---

## ⚙️ Step 5: Configure Codemagic Workflows

The `codemagic.yaml` file is already in your repo. Codemagic will automatically detect it and create workflows.

### Available Workflows

1. **react-native-android**
   - Triggers on: Push to `main`/`develop`, pull requests, version tags
   - Builds: Release APK and AAB
   - Publishes: To Google Play Store (internal track, as draft)

2. **react-native-ios**
   - Triggers on: Push to `main`/`develop`, pull requests, version tags
   - Builds: Release IPA
   - Publishes: To App Store (TestFlight)

3. **react-native-test**
   - Triggers on: Pull requests
   - Runs: Linting and tests

4. **react-native-develop**
   - Triggers on: Push to `develop`
   - Builds: Dev build via EAS

### View Your Workflows

1. In Codemagic dashboard, select your repo
2. Click **Workflows** → You'll see all 4 workflows
3. Each workflow shows logs, artifacts, and publishing status

---

## 🔄 Step 6: Trigger Your First Build

### Option A: Automatic (Recommended)

Just push to your repository:
```bash
git push origin main
```

Codemagic will automatically detect the push and start building.

### Option B: Manual

1. In Codemagic dashboard, select the workflow
2. Click **Start new build**
3. Choose branch (`main` or `develop`)
4. Click **Build**

---

## 📊 Monitoring Builds

### In Codemagic Dashboard

1. **Build Queue** — See pending/running builds
2. **Build Details** — View logs, artifacts, test results
3. **Artifacts** — Download APK/AAB/IPA files
4. **Publishing** — Check if app was published to stores

### Build Logs

Each workflow shows detailed logs for:
- Dependency installation
- Code compilation
- Build process
- Publishing to stores
- Any errors or warnings

---

## 🛠️ Troubleshooting

### "Workflow not found"
→ Make sure `codemagic.yaml` is in your git repo root, not in a subdirectory.

### "Missing environment variable"
→ Check that all variables in the `codemagic.yaml` groups are defined in Codemagic UI.

### "Build failed: gradle error"
→ Scroll to the build logs and look for the error. Usually:
- Wrong Gradle version
- Missing Android SDK
- Signing key issues

### "Certificate expired"
→ Renew your Apple certificate in Developer Account, re-encode it, update in Codemagic.

### "Provisioning profile not valid"
→ Regenerate the profile in Apple Developer Account, making sure:
- Bundle ID matches your app
- Devices are registered
- Certificate is included

---

## 📱 Testing Before Production

### Build to Internal Track (Google Play)

The `codemagic.yaml` currently publishes to **internal** track with `submit_as_draft: true`, so:
- ✅ Your build is uploaded but not live
- ✅ You can test internally before releasing
- ✅ Safe to test on staging

To release to production:
1. In Codemagic, change the workflow track from `internal` to `production`
2. Set `submit_as_draft: false`
3. Push a new tag: `git tag v1.0.1 && git push --tags`

### Build to TestFlight (Apple App Store)

The `codemagic.yaml` publishes to TestFlight automatically. To make it live:
1. In App Store Connect, approve the build for release
2. Increment the build number and push a new version

---

## 🔐 Security Best Practices

✅ **Do:**
- Store sensitive data as environment variables (not in `codemagic.yaml`)
- Use base64-encoding for files
- Rotate API keys periodically
- Use restrictive permissions (App Manager for App Store Connect, not Admin)
- Keep certificates and keystores backed up securely

❌ **Don't:**
- Commit keystore/certificate files to git
- Hardcode passwords or keys in yaml
- Share API credentials publicly
- Use the same keystore for multiple apps

---

## 📈 Workflow Diagram

```
You push to main
    ↓
GitHub notifies Codemagic
    ↓
Codemagic fetches codemagic.yaml
    ↓
Triggers react-native-android + react-native-ios (parallel)
    ↓
├─ Android: Builds APK/AAB → Signs → Publishes to Google Play (internal)
├─ iOS: Builds IPA → Signs → Publishes to App Store (TestFlight)
    ↓
Build complete, artifacts available in Codemagic UI
```

---

## 🎯 Next Steps

1. ✅ `codemagic.yaml` is committed to your repo
2. Create Codemagic account and connect GitHub
3. Set up environment variable groups (google_play, app_store, eas_credentials)
4. Push to `main` branch to trigger first build
5. Monitor build progress in Codemagic dashboard
6. Download APK/IPA artifacts to test locally

---

## 🔗 Useful Links

- [Codemagic Documentation](https://docs.codemagic.io)
- [React Native Building Guide](https://docs.codemagic.io/yaml-quick-start/building-a-react-native-app)
- [Android Signing with Codemagic](https://docs.codemagic.io/yaml-quick-start/building-a-react-native-app/#android-specific-configuration)
- [iOS Signing with Codemagic](https://docs.codemagic.io/yaml-quick-start/building-a-react-native-app/#ios-specific-configuration)
- [Publishing to Google Play](https://docs.codemagic.io/publishing/publishing-to-google-play/)
- [Publishing to App Store](https://docs.codemagic.io/publishing/app-store-connect/)

---

## 📞 Support

- **Codemagic Help:** [support.codemagic.io](https://support.codemagic.io)
- **Community:** [Codemagic Slack Community](https://slack.codemagic.io)
- **This Project:** realitytaiwo2@gmail.com

---

**Status:** ✅ codemagic.yaml committed  
**Next:** Set up environment variables in Codemagic UI  
**Time to First Build:** ~15 minutes after environment setup
