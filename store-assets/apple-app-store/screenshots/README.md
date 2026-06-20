# Apple App Store Screenshots & App Previews

## 📱 Where to Put Your Screenshots

Add **2–10 screenshots** (or app preview video) here for each device type.

### Recommended Resolutions

| Device | Dimensions | Aspect |
|--------|-----------|--------|
| **iPhone 6.5"** | 1242×2688 px | 19.5:9 (recommended) |
| iPhone 6.1" | 1170×2532 px | 19.5:9 |
| iPhone 15 Pro (6.7") | 1284×2778 px | 19.5:9 |
| iPad 12.9" | 2048×2732 px | 4:3 (optional) |

## 🎯 Recommended Screenshot Sequence

Create 5–8 screenshots in **1242×2688 px** (iPhone 6.5") format:

1. **01-main-recitation.png**
   - Qur'an recitation screen with word-by-word
   - Text: "Melodic Recitation 🎙️"

2. **02-voice-search.png**
   - Voice Assistant or Surah Selection
   - Text: "Hands-Free Search 🔍"

3. **03-reciter-choice.png**
   - Reciter selection showing 6 options
   - Text: "6 Renowned Reciters 🎵"

4. **04-english-narration.png**
   - English translation or Both mode
   - Text: "English Narration 🗣️"

5. **05-bookmarks.png**
   - Bookmarked verses and resume
   - Text: "Save & Resume 📖"

6. **06-voice-practice.png**
   - Voice recording practice mode
   - Text: "Practice Recitation 🎤"

7. **07-themes.png**
   - Day/night modes, profiles
   - Text: "Customize Experience ⚙️"

8. **08-offline.png** (optional)
   - Offline reading capability
   - Text: "Read Offline 📱"

## 🎬 Creating Screenshots

### Option 1: iOS Simulator (Easiest for Apple)
```bash
# Start the app in iOS simulator at 6.5" size
npm start
# Select iOS simulator

# Simulator menu → Device → Screenshot
# Or Cmd+S (iOS Simulator)
# Automatically saves to ~/Pictures/
```

### Option 2: Physical iPhone
- Press Power + Volume Up simultaneously
- Screenshot saves to Photos app
- AirDrop or email to computer
- Crop to 1242×2688 if needed

### Option 3: Add Text Overlays
1. Take screenshots (using options above)
2. Open in Figma, Photoshop, or free tools (GIMP, Pixlr)
3. Add text labels (captions)
4. Export at 1242×2688 PNG

## 🎬 App Preview Video (Optional but Recommended)

Create a **15–30 second video** showing app features:

- **Format:** MP4 or MOV
- **Dimensions:** 1242×2688 px (iPhone 6.5") or device native
- **Length:** 15–30 seconds max
- **Audio:** Recommended (voiceover, music, or both)

### What to Include
- App opening
- Main recitation screen (word-by-word)
- Voice search demo
- Reciter switching
- Translation toggle
- End with app icon + tagline

### Tools to Create
- **iMovie** (Mac/iOS) — easiest
- **CapCut** (iOS/Android/Web) — free, powerful
- **Adobe Premiere** (advanced)
- **FFmpeg** (command-line)

### Upload
- Save as `01-app-preview.mp4` in this folder
- Upload to App Store Connect under "App Preview" (separate from screenshots)

## ✅ Quality Checklist

- [ ] Screenshots are 1242×2688 px (or correct device size)
- [ ] All text is large and readable (minimum 40pt)
- [ ] Consistent visual theme across all screenshots
- [ ] No blurry, pixelated, or cut-off content
- [ ] Safe zone respected (20px from edges)
- [ ] Shows real app features, not mockups
- [ ] Status bar visible and clean
- [ ] No debug info, Lorem Ipsum, or test data
- [ ] Each screenshot focuses on one key feature
- [ ] First screenshot immediately communicates app value

## 📋 Naming Convention

```
01-main-recitation.png
02-voice-search.png
03-reciter-selection.png
04-english-narration.png
05-bookmarks.png
06-voice-practice.png
07-themes.png
08-offline-reading.png
01-app-preview.mp4  (optional video)
```

## 🚀 Upload to App Store Connect

### Screenshots
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → **App Information**
3. → **App Preview and Screenshots**
4. Select device type (iPhone 6.5", etc.)
5. Upload screenshots (drag & drop)
6. Reorder by dragging (first is most important)
7. Add to all required languages if applicable

### App Preview Video
1. Same location: **App Preview and Screenshots**
2. Click **Add App Preview**
3. Upload your video (MP4 or MOV)
4. Preview and save

## 💡 Pro Tips for Apple App Store

- **Device Scaling:** Upload for 6.5" iPhone; Apple auto-scales for other devices
- **Safe Zone:** Avoid critical content within 20px of edges
- **Text Placement:** Top 20% or bottom 20% works best
- **First Screenshot:** Should immediately convey app's main value
- **Consistency:** Use same font, colors, style across all screenshots
- **Video Preview:** Videos increase conversion by 20–30% (highly recommended)
- **Localization:** Create screenshots per language if submitting in multiple regions

## 📐 Safe Zone Diagram

```
┌─────────────────────────┐
│                         │
│  20px margin (safe)     │
│  ┌─────────────────┐    │
│  │                 │    │
│  │   Content       │    │
│  │   Area          │    │
│  │                 │    │
│  └─────────────────┘    │
│  20px margin (safe)     │
│                         │
└─────────────────────────┘
```

## ❓ FAQ

**Q: Must I upload for all device sizes?**  
A: No — 6.5" iPhone (1242×2688) is sufficient. Apple scales automatically.

**Q: How many screenshots do I need?**  
A: 2–10 recommended. Start with 5–6 high-quality ones.

**Q: Should I add captions/text to screenshots?**  
A: Yes — feature labels help viewers understand what they're seeing.

**Q: Is app preview video required?**  
A: No, but strongly recommended — it increases downloads by 20–30%.

**Q: Can I use the same screenshots as Google Play?**  
A: Content yes, but dimensions differ (Apple: 1242×2688 vs Play: 1080×1920).

**Q: Can I update screenshots after submission?**  
A: Yes — submit an update and reupload without bumping the app version.

---

**Status:** Ready for your screenshots and video  
**Required:** 2–10 screenshots (recommended: 5–6 + optional video)  
**Supported Languages:** Add per locale if needed
