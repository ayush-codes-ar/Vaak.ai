# VaakAI – Offline Hindi Translator
### Fully on-device · No API · No cloud · App Store ready

---

## What This Is

A real production Expo React Native app that translates English → Hindi using:
- **Helsinki-NLP/opus-mt-en-hi** (MarianMT neural translation model)
- **ONNX Runtime React Native** for on-device inference
- **expo-speech** for offline Hindi TTS
- **expo-secure-store** for PIN-protected history

---

## ⚠️ Important: Why You Need a Custom Build

`onnxruntime-react-native` uses **native modules** (C++ ONNX Runtime).  
This means **Expo Go will NOT work** — you need a custom dev client or a production build.

**The good news:** EAS Build is **free** and builds your APK/IPA in the cloud.

---

## 🚀 Step-by-Step Setup (30 minutes)

### Step 1: Install prerequisites

```bash
# Install Node.js 18+ from https://nodejs.org
# Install Expo CLI
npm install -g expo-cli eas-cli

# Verify
node --version   # should be 18+
eas --version
```

### Step 2: Set up the project

```bash
# Clone/copy this folder, then:
cd VaakAI
npm install
```

### Step 3: Create a free Expo account

Go to https://expo.dev → Sign up (free)

```bash
eas login
# Enter your Expo account credentials
```

### Step 4: Configure EAS Build

```bash
eas build:configure
# Select: Android + iOS
# This creates/updates eas.json (already included)
```

### Step 5: Build Android APK (Free!)

```bash
# This builds in Expo's cloud — no Android Studio needed!
eas build --platform android --profile preview

# Wait ~10-15 minutes
# You'll get a download link for the .apk file
```

### Step 6: Install on your phone

1. Download the `.apk` from the EAS link
2. On your Android phone: Settings → Security → Allow Unknown Sources
3. Open the APK → Install
4. Done! VaakAI is on your phone 🎉

---

## 📱 iOS Build (Mac required)

```bash
eas build --platform ios --profile preview
# Requires Apple Developer account ($99/year) for device install
# OR use simulator on Mac: npx expo run:ios
```

---

## 🔧 Local Development (with Android Studio)

If you want to test locally without EAS:

```bash
# Install Android Studio from https://developer.android.com/studio
# Set ANDROID_HOME environment variable

# Then:
npx expo prebuild --platform android
npx expo run:android
```

---

## 📁 Project Structure

```
VaakAI/
├── app/
│   ├── _layout.tsx          # Root navigation
│   ├── index.tsx            # Home / Translator screen
│   ├── history.tsx          # PIN-protected history
│   └── settings.tsx         # Settings screen
├── components/
│   ├── GlassCard.tsx        # Reusable glass card
│   ├── ModelLoader.tsx      # ONNX download progress UI
│   └── PinInput.tsx         # 4-digit PIN component
├── services/
│   ├── translationService.ts  # ← ONNX inference engine (swap this for upgrades)
│   └── historyService.ts      # Local history + PIN storage
├── constants/
│   └── theme.ts             # Colors, spacing, radii
├── app.json                 # Expo config
├── eas.json                 # EAS Build profiles
└── package.json
```

---

## 🤖 How the AI Model Works

1. **First launch:** Downloads ~30MB from Hugging Face CDN (opus-mt-en-hi)
2. **Cached:** Stored in `FileSystem.documentDirectory` — persists forever
3. **Translation:** `encoder_model.onnx` + `decoder_model_merged.onnx` run via ONNX Runtime
4. **After download:** Works 100% offline, even in airplane mode ✈️

### Upgrading the model (Phase 2)

Just edit `services/translationService.ts`:
- Swap the model URL for any ONNX MarianMT model
- Same API: `translate(text: string): Promise<string>`

---

## 🎬 Hackathon Demo Flow

1. Turn on airplane mode
2. Open VaakAI (model already cached)
3. Type: "Hello, how are you?"
4. Tap Translate → "नमस्ते, आप कैसे हैं?"
5. Tap 🔊 → Hear it in Hindi
6. Show Settings → Enable Secure History
7. Set PIN → Save translations
8. Lock & unlock history with PIN
9. **Say:** "This entire AI translation runs offline on-device. No cloud, no API."

---

## 🆓 Completely Free

| Service | Cost |
|---------|------|
| Expo / EAS Build | Free (30 builds/month) |
| Hugging Face model hosting | Free |
| ONNX Runtime React Native | Open source |
| App runtime | Free |

**Total: $0** 🎉

---

## 📦 Dependencies

- `onnxruntime-react-native` — ONNX inference engine
- `expo-speech` — Offline Hindi TTS
- `expo-secure-store` — Encrypted PIN storage
- `expo-file-system` — Model file caching
- `@react-native-async-storage/async-storage` — History storage
- `expo-haptics` — Tactile feedback
- `expo-router` — File-based navigation
