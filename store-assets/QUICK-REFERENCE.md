# Quick Reference: Store Asset Checklist

## 🎯 What's Included

### Google Play Store
- ✅ **App Icon** (512×512 px) — `app-icon-512x512.png`
- ✅ **Feature Graphic** (1024×500 px) — `feature-graphic-1024x500.png` (main banner)
- ✅ **Promo Graphic** (180×120 px) — `promo-graphic-180x120.png`
- 📁 **Screenshots folder** — Empty, ready for your 1080×1920 screenshots

### Apple App Store
- ✅ **App Icon** (1024×1024 px) — `app-icon-1024x1024.png`
- ✅ **Marketing Artwork** (1024×1024 px) — `marketing-artwork-1024x1024.png`
- 📁 **Screenshots folder** — Empty, ready for your 1242×2688 screenshots

### Shared / Additional Sizes
- ✅ Icon (192×192 px)
- ✅ Icon (256×256 px)
- ✅ Icon (512×512 px)

---

## 📋 What You Still Need to Create

### Required Before Submission

| Store | Asset | Dimensions | What to Do |
|-------|-------|-----------|-----------|
| **Google Play** | Screenshots | 1080×1920 px (2–8 images) | Take screenshots of your app showing: main screen, voice search, recitation, bookmarks |
| **Apple** | Screenshots | 1242×2688 px (2–10 images) | Same as above, but in iPhone aspect ratio |
| **Both** | Metadata (text) | — | App name, description, keywords, privacy policy |

### Optional (Recommended)
- App preview video (30 seconds max) for Apple App Store
- Tablet screenshots for Google Play (1440×2560 px)

---

## 🚀 Quick Upload Steps

### Google Play Store
1. Go to [Google Play Console](https://play.google.com/console)
2. **Store presence** → **Main store listing**
3. Upload:
   - App icon → `app-icon-512x512.png`
   - Feature graphic → `feature-graphic-1024x500.png`
   - Screenshots (8 max) → your 1080×1920 images in `screenshots/` folder

### Apple App Store
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. **App Information** → **App Preview and Screenshots**
3. Upload:
   - App icon → `app-icon-1024x1024.png`
   - Marketing artwork → `marketing-artwork-1024x1024.png`
   - Screenshots (2–10) → your 1242×2688 images in `screenshots/` folder

---

## 📐 Dimensions at a Glance

```
Google Play Store:
  Icon:              512 × 512
  Feature Graphic:  1024 × 500  ← Main banner
  Promo Graphic:     180 × 120
  Screenshots:      1080 × 1920

Apple App Store:
  Icon:             1024 × 1024
  Marketing Art:    1024 × 1024
  Screenshots:      1242 × 2688  ← Universal (scales automatically)
```

---

## 💾 File Organization

```
store-assets/
├── google-play-store/
│   ├── app-icon-512x512.png                    ✓ Ready
│   ├── feature-graphic-1024x500.png            ✓ Ready
│   ├── promo-graphic-180x120.png               ✓ Ready
│   └── screenshots/                            📁 Your screenshots here
├── apple-app-store/
│   ├── app-icon-1024x1024.png                  ✓ Ready
│   ├── marketing-artwork-1024x1024.png         ✓ Ready
│   └── screenshots/                            📁 Your screenshots here
├── shared/
│   ├── app-icon-192x192.png
│   ├── app-icon-256x256.png
│   └── app-icon-512x512.png
├── STORE-ASSETS-GUIDE.md                       📖 Full guide
└── QUICK-REFERENCE.md                          ✓ This file
```

---

## 🎨 Using the Icons in Other Places

The **shared/** folder has ready-to-use icons for:
- Website favicon (192×192 or 256×256)
- Social media thumbnails (256×256)
- Documentation/GitHub (512×512)

---

## ✨ Important Reminders

- ✅ **All PNG images** are provided — no need to re-create
- ✅ **All dimensions** are correct for each store
- ✅ **Colors match** your app theme (emerald #0E7C5A, gold #C9A227)
- ✅ **Base icon** is your app logo (from `assets/icon.png`)
- 📝 **Read** `STORE-ASSETS-GUIDE.md` for full details on screenshot creation
- 🎯 **Focus next** on creating 1080×1920 (Play) and 1242×2688 (Apple) screenshots

---

## 🎬 Screenshot Tips

### What to Show
1. **Screen 1:** Main recitation screen (show word-by-word highlighting)
2. **Screen 2:** Voice search in action
3. **Screen 3:** Reciter selection/settings
4. **Screen 4:** Bookmarks & reading progress
5. **Screen 5–8:** Additional features (voice practice, translations, themes)

### How to Make Them
1. **Method A (Easiest):**
   - Open app in Android emulator (1080×1920 resolution)
   - Press Ctrl+Shift+S to take screenshot
   - Save in `store-assets/google-play-store/screenshots/`

2. **Method B (Add Text Overlays):**
   - Take screenshots (as above)
   - Open in Figma, Photoshop, or GIMP
   - Add feature labels (e.g., "Melodic Recitation 🎙️")
   - Export at same resolution

3. **Method C (Video Preview):**
   - Record 30-second video of app walkthrough
   - Use CapCut or iMovie to trim & add captions
   - Export as MP4, upload to Apple App Store only

---

## 🔗 Store Links

- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Play Store Design Guidelines](https://support.google.com/googleplay/android-developer/answer/1078870)
- [App Store App Preview Guidelines](https://developer.apple.com/app-store/app-previews/)

---

## ❓ FAQ

**Q: Can I use the same screenshots on both stores?**  
A: No — Google Play uses 1080×1920, Apple uses 1242×2688 (different aspect ratios). However, you can use the same *content* and adapt the dimensions.

**Q: Do I need all 8 screenshots for Google Play?**  
A: No — minimum is 2, maximum is 8. Start with 3–4 high-quality ones.

**Q: Can I use the app icon as the feature graphic?**  
A: Yes, but it's not ideal — the feature graphic should show your app's key value prop. Using an icon + text overlay is fine.

**Q: What if my app changes after store submission?**  
A: Update the screenshots and re-upload. Stores let you change assets without bumping the app version.

**Q: Where should text go on screenshots?**  
A: Top 10% or bottom 10%, avoiding status bar (top) and navigation bar (bottom). Keep 20px margin from edges.

---

## ✅ Submission Readiness

- [x] Icons for both stores → Ready
- [x] Dimensions correct → Verified
- [ ] Screenshots created → **Your turn**
- [ ] Metadata written → **Your turn**
- [ ] Privacy policy → **Your turn** (required for Apple)
- [ ] Screenshots uploaded → After creation

---

**Status:** 8 of 11 assets ready (73%)  
**Next Step:** Create 1080×1920 (Play) and 1242×2688 (Apple) screenshots
