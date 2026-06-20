# App Store Assets Guide

Complete asset specifications for **Google Play Store** and **Apple App Store** submissions.

---

## 📋 Folder Structure

```
store-assets/
├── google-play-store/          # Google Play Store assets
│   ├── app-icon-512x512.png    # Store listing icon
│   ├── feature-graphic-1024x500.png  # Main promotional banner
│   ├── promo-graphic-180x120.png     # Small promotional graphic
│   └── screenshots/            # Phone screenshots (1080x1920+)
├── apple-app-store/            # Apple App Store assets
│   ├── app-icon-1024x1024.png  # iTunes Connect icon
│   ├── marketing-artwork-1024x1024.png
│   └── screenshots/            # App previews (1242x2688+)
└── shared/                      # Common assets
    ├── app-icon-192x192.png
    ├── app-icon-256x256.png
    └── app-icon-512x512.png
```

---

## 🎮 Google Play Store

### Required Assets

| Asset | Dimensions | Format | Notes |
|-------|-----------|--------|-------|
| **App Icon** | 512×512 px | PNG | Transparent or solid background; no rounded corners |
| **Feature Graphic** | 1024×500 px | PNG/JPG | Main banner displayed at top of listing |
| **Promo Graphic** | 180×120 px | PNG/JPG | Small promotional tile (optional) |
| **Screenshots** | 1080×1920 px (min 2, max 8) | PNG/JPG | Phone screenshots showing key features |
| **Tablet Screenshots** | 1440×2560 px (optional) | PNG/JPG | For tablets |

### File Locations in This Folder

- ✅ `app-icon-512x512.png` — Upload as "App Icon"
- ✅ `feature-graphic-1024x500.png` — Upload as "Feature Graphic"
- ✅ `promo-graphic-180x120.png` — Upload as "Promotional Graphic" (optional)
- 📁 `screenshots/` — Create your phone screenshots here (1080×1920)

### Guidelines

- **App icon:** Should have 12% padding from edges
- **Feature graphic:** Avoid critical content near edges (safe zone: 50px padding)
- **Screenshots:** Show app in action; use 2–8 screenshots highlighting key features
- **Text:** Readable at small sizes; main features visible in first 1–2 screenshots

### Upload Instructions

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app → **Store presence** → **Listings** → **Main store listing**
3. Upload assets in the corresponding sections
4. Screenshots: Upload 1–8 images (landscape or portrait)

---

## 🍎 Apple App Store

### Required Assets

| Asset | Dimensions | Format | Notes |
|-------|-----------|--------|-------|
| **App Icon** | 1024×1024 px | PNG | No transparency, rounded corners applied by iOS |
| **Screenshots** | 1242×2688 px (6.5") | PNG/JPG | Or 1170×2532 (6.1"), 1284×2778 (6.7") |
| **iPad Screenshots** | 2048×2732 px (optional) | PNG/JPG | For iPad apps |
| **App Preview Video** | MP4/MOV (max 30s) | Video | Optional but recommended |
| **Marketing Artwork** | 1024×1024 px | PNG/JPG | Used for App Store featuring |

### File Locations in This Folder

- ✅ `app-icon-1024x1024.png` — Upload as "App Icon"
- ✅ `marketing-artwork-1024x1024.png` — Upload as "Marketing Artwork"
- 📁 `screenshots/` — Create your iPhone screenshots here (1242×2688)

### Guidelines

- **App icon:** Automatically rounded by iOS; no need to pre-round corners
- **Screenshots:** 2–10 per device type; show key features and user benefits
- **Safe zone:** Avoid content within 20px of edges on all sides
- **Text:** Large, readable; focus on feature highlights, not technical details
- **Video preview:** 15–30 seconds showing app in action (highly recommended)

### Upload Instructions

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → **App Information** → **App Preview and Screenshots**
3. Select device type (iPhone 6.5", etc.)
4. Upload 2–10 screenshots per device type
5. Add screenshots for each language/region if needed

---

## 📱 Device-Specific Dimensions

### iPhone Screenshots for App Store

| Device | Dimension | Aspect |
|--------|-----------|--------|
| iPhone 15 Pro Max / 14 Pro Max (6.7") | 1284×2778 px | 19.5:9 |
| iPhone 15 Plus / 14 Plus (6.7") | 1284×2778 px | 19.5:9 |
| iPhone 15 / 14 / 13 (6.1") | 1170×2532 px | 19.5:9 |
| iPhone SE / 8 / 7 (4.7") | 750×1334 px | 16:9 |
| iPad Pro 12.9" | 2048×2732 px | 4:3 |

**Recommended:** Use **1242×2688 px** (6.5") as the universal screenshot size—Apple scales it for other devices automatically.

---

## 🎨 Design Tips

### Branding & Consistency
- Use your app's **emerald (#0E7C5A)** and **gold (#C9A227)** color scheme
- Include app logo/icon in screenshots where relevant
- Maintain consistent typography (naskh-style Arabic font recommended)
- Use consistent borders/spacing between screenshots

### Screenshot Best Practices
1. **First Screenshot:** Show the main screen and app's primary value
2. **Highlight Features:** Voice search, reciter selection, translation modes
3. **Show User Interactions:** Gesture examples (swipe, tap, voice command)
4. **Use Captions:** Add 1–2 words per screenshot explaining the feature
5. **Consistent Theme:** Use the same device bezel/status bar across all screenshots

### Text Overlays
- **Position:** Top 10% or bottom 10% of screen (safe from status bar)
- **Font:** Bold, sans-serif (at least 40–48pt)
- **Color:** White (#FFF) or gold (#C9A227) with dark shadow for contrast
- **Examples:**
  - "Melodic Recitation 🎙️"
  - "Word-by-Word Translation 📖"
  - "Voice Search 🔍"
  - "Arabic + English 🗣️"

---

## 📏 Version Management

Update these files whenever you:
- Change app icon
- Redesign key screens
- Add major features
- Update app version on stores

**Naming Convention:**
```
app-icon-512x512-v1.2.png
feature-graphic-1024x500-v1.2.png
screenshot-01-v1.2.png
```

---

## ✅ Pre-Submission Checklist

### Google Play Store
- [ ] App icon (512×512) is crisp and recognizable at small sizes
- [ ] Feature graphic (1024×500) has no critical content within 50px edges
- [ ] 2–8 screenshots provided (1080×1920 minimum)
- [ ] Screenshots show real app features, not mockups
- [ ] No placeholder text or Lorem Ipsum in screenshots
- [ ] All images meet resolution minimums
- [ ] File sizes under 16 MB each

### Apple App Store
- [ ] App icon (1024×1024) has no transparency issues
- [ ] Screenshots (1242×2688) are provided for at least one device
- [ ] Safe zone respected (20px padding from all edges)
- [ ] Text is legible on small preview thumbnails
- [ ] Marketing artwork (1024×1024) is App Store-appropriate
- [ ] No screenshots showing competitors' apps or ads
- [ ] All images meet resolution minimums

---

## 🔗 Resources

- **Google Play Store Graphics Guidelines:** https://support.google.com/googleplay/android-developer/answer/1078870
- **Apple App Store App Preview Guidelines:** https://developer.apple.com/app-store/app-previews/
- **Icon Design Guidelines:**
  - [Material Design Icons](https://m3.material.io/styles/icons)
  - [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)

---

## 📸 Creating Better Screenshots

### Tools Recommended
- **Screenshot Automation:** Android Studio (emulator) / Xcode (simulator)
- **Editing:** Figma, Adobe XD, Photoshop, or free alternatives (GIMP, Pixlr)
- **Video Editing:** CapCut, iMovie, Adobe Premiere (for app preview video)

### Quick Workflow
1. Run app in emulator/simulator at target resolution
2. Take screenshots of key user flows
3. Add text overlays explaining each feature
4. Export at correct dimensions for each store
5. Review for clarity, branding consistency, and text readability

---

## 📝 Metadata You'll Also Need

These are **text-based** (not images) but equally important:

### Both Stores
- **App Name:** Qur'an Voice Reader
- **Short Description:** (Play Store: 80 chars max) "Melodic Qur'an recitation with real voices, word-by-word highlighting, and hands-free voice search."
- **Full Description:** Feature list, benefits, permissions explanation
- **Keywords/Tags:** Quran, recitation, Arabic, Islamic, voice, reader
- **Category:** Books & Reference / Education

### Google Play Only
- **Tagline:** "Authentic Melodic Qur'an Recitation"
- **Promotional Text:** "Read the Qur'an with renowned reciters—Arabic and English narration, voice search, and bookmarks."

### Apple App Store Only
- **Subtitle:** (30 chars max) "Melodic Qur'an & Translation"
- **Privacy Policy URL:** (must have one before submission)
- **Support URL:** Include developer contact/email

---

## 💡 Why Each Asset Matters

| Asset | Purpose |
|-------|---------|
| **App Icon** | First visual impression; used in store listings, device home screen, search results |
| **Feature Graphic** | Main banner at top of store page; captures attention, sets tone |
| **Screenshots** | Convince users the app is worth downloading; show functionality at a glance |
| **Marketing Artwork** | Used by the store for promoting your app; increases visibility |

---

## 🎯 Next Steps

1. **Review & Adjust:** Customize screenshots to match current app UI
2. **Test Quality:** Export and view on actual devices/web browsers
3. **Get Feedback:** Share screenshots with friends/beta testers
4. **Finalize:** Once happy, upload to respective app stores
5. **Monitor:** Track download trends; A/B test screenshots if stores allow

---

**Last Updated:** June 2026  
**App Version:** 1.0.0  
**Status:** Ready for Store Submission ✅
