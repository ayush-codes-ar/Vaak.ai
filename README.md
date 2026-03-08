<div align="center">

<img src="assets/icon.png" width="120" height="120" alt="VaakAI Logo" />

<h1>VaakAI — वाक्AI</h1>

<p><strong>Real Neural AI Translation. Zero Internet. Always Private.</strong></p>

<p>
  <img src="https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" />
  <img src="https://img.shields.io/badge/Built%20With-Expo-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/AI%20Model-MarianMT%20ONNX-FF6F00?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Offline-100%25-22C55E?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-8B5CF6?style=for-the-badge" />
</p>

<p><em>From the Sanskrit word वाक् (Vāk) — meaning "speech" or "voice"</em></p>

</div>

---

## 🌍 The Problem

India has over **500 million Hindi speakers**. Yet every major translation tool — Google Translate, DeepL, Microsoft Translator — requires a stable internet connection to function.

In rural areas, on flights, in hospitals with poor signal, or anywhere connectivity is unreliable, these tools fail completely. Language barriers become dangerous barriers.

**VaakAI solves this.**

---

## ✨ What is VaakAI?

VaakAI is a **fully offline, privacy-first neural machine translation app** for Android. It runs a real transformer AI model entirely on your device — no internet connection required, no data ever sent to any server.

> *"Not a dictionary. Not an API. A real AI running on your phone."*

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| 🧠 **Real Neural AI** | Helsinki-NLP MarianMT transformer — same architecture used by production translation services worldwide |
| 📴 **100% Offline** | Works on planes, in villages, in hospitals — anywhere, anytime |
| 🔒 **Zero Data Leakage** | Your text never leaves your device. No servers. No logs. No tracking. Ever. |
| ⚡ **Quantized Model** | INT8 quantization shrinks the model from 500MB+ to ~130MB with minimal quality loss |
| 🗣️ **Text-to-Speech** | Hear Hindi translations spoken aloud in natural voice |
| 📋 **One-Tap Copy** | Copy any translation instantly to clipboard |
| 🕘 **Translation History** | All translations saved locally — accessible offline forever |
| 🌙 **Beautiful Dark UI** | Designed for readability and one-handed use |

---

## 🤖 How It Works
```
English Input
      │
      ▼
┌─────────────────┐
│  JS Tokenizer   │  ← SentencePiece vocab (61,950 tokens)
│  (case-aware)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ONNX Encoder   │  ← MarianMT Encoder (49MB quantized)
│  encoder.onnx   │    Converts tokens → hidden states [1, seq, 512]
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ONNX Decoder   │  ← MarianMT Decoder (85MB quantized)
│  decoder.onnx   │    Autoregressively generates Hindi tokens
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Token Decoder   │  ← target_vocab.json → Devanagari text
└────────┬────────┘
         │
         ▼
   Hindi Output 🇮🇳
```

Everything runs **on-device** using ONNX Runtime — the same inference engine used internally by Microsoft, Meta, and Google.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native + Expo SDK 52 |
| **ML Inference** | ONNX Runtime React Native 1.20.0 |
| **AI Model** | Helsinki-NLP/opus-mt-en-hi (MarianMT) |
| **Model Export** | Hugging Face Optimum |
| **Quantization** | ONNX Runtime INT8 Dynamic Quantization |
| **Text-to-Speech** | expo-speech (hi-IN) |
| **File System** | expo-file-system |
| **Navigation** | Expo Router (file-based) |
| **Language** | TypeScript |

---

## 📊 Model Specifications

| Property | Value |
|---|---|
| Base Model | Helsinki-NLP/opus-mt-en-hi |
| Architecture | MarianMT (Transformer seq2seq) |
| Parameters | ~74 million |
| Original Size | ~521MB (encoder + decoder) |
| Quantized Size | ~134MB (INT8 dynamic) |
| Quantization | INT8 Dynamic (ONNX Runtime) |
| Size Reduction | **74% smaller** |
| Inference Engine | ONNX Runtime CPU |
| Decoding Strategy | Greedy search (128 max tokens) |
| Vocabulary Size | 61,950 tokens (SentencePiece) |

---

## 📁 Project Structure
```
VaakAI/
├── app/                          # Expo Router screens
│   ├── index.tsx                 # Main translation screen
│   ├── history.tsx               # Translation history
│   ├── settings.tsx              # App settings
│   └── _layout.tsx               # Navigation layout
├── services/
│   ├── translationService.ts     # ONNX inference engine + tokenizer
│   └── historyService.ts         # Local history persistence
├── components/
│   ├── GlassCard.tsx             # Reusable card component
│   └── ModelLoader.tsx           # Model loading UI + progress
├── constants/
│   └── theme.ts                  # Colors, spacing, radius tokens
└── android/app/src/main/
    └── assets/models/            # ONNX models (not in git — see setup)
        ├── encoder_model.onnx    # 49MB quantized encoder
        ├── decoder_model.onnx    # 85MB quantized decoder
        ├── vocab.json            # Source vocabulary (EN)
        └── target_vocab.json     # Target vocabulary (HI)
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio + Android SDK
- Python 3.10 (for model preparation only)
- Conda environment recommended

### 1. Clone & Install
```bash
git clone https://github.com/ayush-codes-ar/Vaak.ai.git
cd Vaak.ai
npm install
```

### 2. Prepare the AI Models

The ONNX models are excluded from git (too large). Generate them with Python:
```bash
# Install Python dependencies
pip install optimum==1.21.2 transformers==4.42.4 onnx==1.16.2 onnxruntime==1.18.1 sentencepiece

# Export MarianMT to ONNX format
python -c "
from transformers import AutoTokenizer
from optimum.onnxruntime import ORTModelForSeq2SeqLM
model = ORTModelForSeq2SeqLM.from_pretrained('Helsinki-NLP/opus-mt-en-hi', export=True)
tokenizer = AutoTokenizer.from_pretrained('Helsinki-NLP/opus-mt-en-hi')
model.save_pretrained('./en-hi-onnx')
tokenizer.save_pretrained('./en-hi-onnx')
"

# Quantize to INT8 (500MB → 130MB)
python -c "
from onnxruntime.quantization import quantize_dynamic, QuantType
quantize_dynamic('./en-hi-onnx/encoder_model.onnx', './en-hi-onnx-q/encoder_model.onnx', weight_type=QuantType.QUInt8)
quantize_dynamic('./en-hi-onnx/decoder_model.onnx', './en-hi-onnx-q/decoder_model.onnx', weight_type=QuantType.QUInt8)
"

# Export vocabularies
python -c "
from transformers import MarianTokenizer
import json
tok = MarianTokenizer.from_pretrained('Helsinki-NLP/opus-mt-en-hi')
with open('./en-hi-onnx-q/vocab.json', 'w', encoding='utf-8') as f:
    json.dump(dict(tok.encoder), f, ensure_ascii=False)
with open('./en-hi-onnx-q/target_vocab.json', 'w', encoding='utf-8') as f:
    json.dump(dict(tok.decoder), f, ensure_ascii=False)
"
```

### 3. Copy Models to Android Assets
```bash
mkdir -p android/app/src/main/assets/models

cp en-hi-onnx-q/encoder_model.onnx android/app/src/main/assets/models/
cp en-hi-onnx-q/decoder_model.onnx android/app/src/main/assets/models/
cp en-hi-onnx-q/vocab.json android/app/src/main/assets/models/
cp en-hi-onnx-q/target_vocab.json android/app/src/main/assets/models/
```

### 4. Run
```bash
# Local development (requires Android emulator)
npx expo run:android

# Production APK via EAS
eas build --platform android --profile preview
```

---

## 🔮 Roadmap

- [ ] Hindi → English reverse translation
- [ ] More Indian languages (Tamil, Telugu, Bengali, Marathi, Punjabi)
- [ ] Voice input with on-device speech recognition
- [ ] Beam search decoding for improved translation quality
- [ ] Model download on first launch (smaller initial APK)
- [ ] Phrase bookmarks and favorites
- [ ] iOS support
- [ ] Widget for quick translations

---

## 🙏 Acknowledgements

- [Helsinki-NLP](https://github.com/Helsinki-NLP) — MarianMT model
- [Microsoft ONNX Runtime](https://onnxruntime.ai/) — On-device inference engine
- [Hugging Face Optimum](https://github.com/huggingface/optimum) — ONNX export pipeline
- [Expo](https://expo.dev/) — React Native framework

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

<h3>वाक् — The Voice That Never Needs the Cloud</h3>

<p>Built with ❤️ for offline India</p>

<p>
  <a href="https://github.com/ayush-codes-ar/Vaak.ai/releases">📱 Download APK</a> ·
  <a href="https://github.com/ayush-codes-ar/Vaak.ai/issues">🐛 Report Bug</a> ·
  <a href="https://github.com/ayush-codes-ar/Vaak.ai/issues">✨ Request Feature</a>
</p>

</div>