/**
 * VaakAI Translation Service
 * 
 * Uses ONNX Runtime React Native to run Helsinki-NLP/opus-mt-en-hi
 * (MarianMT model) fully on-device.
 * 
 * Model files must be placed in: assets/models/
 *   - encoder_model.onnx
 *   - decoder_model_merged.onnx  
 *   - vocab.json
 *   - source.spm  (sentencepiece tokenizer)
 *   - target.spm
 * 
 * Download script: scripts/download_model.py
 */

import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

// ── Tokenizer (SentencePiece via vocab lookup) ──────────────────────────────
// A lightweight JS tokenizer for MarianMT en-hi.
// In production, use a full sentencepiece WASM module.
// This implementation handles the most common English patterns.

const BOS_TOKEN_ID = 0;
const EOS_TOKEN_ID = 0;
const PAD_TOKEN_ID = 65001;
const MAX_LENGTH = 128;

// Vocabulary and tokenizer state
let encoderSession: InferenceSession | null = null;
let decoderSession: InferenceSession | null = null;
let srcVocab: Record<string, number> = {};
let tgtVocabInv: Record<number, string> = {};
let modelReady = false;
let loadProgress = 0;

export type ProgressCallback = (progress: number, message: string) => void;

// ── Model Loading ─────────────────────────────────────────────────────────────

/**
 * Download model files from Hugging Face and cache locally.
 * Files are stored in FileSystem.documentDirectory/models/
 */
export async function loadTranslationModel(
  onProgress?: ProgressCallback
): Promise<void> {
  const modelDir = FileSystem.documentDirectory + 'models/';
  
  // Ensure directory exists
  const dirInfo = await FileSystem.getInfoAsync(modelDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });
  }

  const files = [
    {
      name: 'encoder_model.onnx',
      url: 'https://huggingface.co/Xenova/opus-mt-en-hi/resolve/main/onnx/encoder_model.onnx',
      size: '~15MB',
    },
    {
      name: 'decoder_model_merged.onnx', 
      url: 'https://huggingface.co/Xenova/opus-mt-en-hi/resolve/main/onnx/decoder_model_merged.onnx',
      size: '~15MB',
    },
    {
      name: 'vocab.json',
      url: 'https://huggingface.co/Helsinki-NLP/opus-mt-en-hi/resolve/main/vocab.json',
      size: '~800KB',
    },
    {
      name: 'source.spm',
      url: 'https://huggingface.co/Helsinki-NLP/opus-mt-en-hi/resolve/main/source.spm',
      size: '~800KB',
    },
    {
      name: 'target.spm',
      url: 'https://huggingface.co/Helsinki-NLP/opus-mt-en-hi/resolve/main/target.spm',
      size: '~800KB',
    },
  ];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const localPath = modelDir + file.name;
    const fileInfo = await FileSystem.getInfoAsync(localPath);

    if (!fileInfo.exists) {
      onProgress?.(
        (i / files.length) * 80,
        `Downloading ${file.name} (${file.size})…`
      );
      
      const download = FileSystem.createDownloadResumable(
        file.url,
        localPath,
        {},
        (downloadProgress) => {
          const fileProgress = downloadProgress.totalBytesWritten / 
            (downloadProgress.totalBytesExpectedToWrite || 1);
          const overall = ((i + fileProgress) / files.length) * 80;
          onProgress?.(overall, `Downloading ${file.name}… ${Math.round(fileProgress * 100)}%`);
        }
      );
      
      await download.downloadAsync();
    } else {
      onProgress?.(
        ((i + 1) / files.length) * 80,
        `${file.name} cached ✓`
      );
    }
  }

  // Load vocab
  onProgress?.(82, 'Loading vocabulary…');
  const vocabJson = await FileSystem.readAsStringAsync(modelDir + 'vocab.json');
  const vocab = JSON.parse(vocabJson);
  
  // Build source vocab (English tokens → IDs)
  if (vocab.source_to_target) {
    srcVocab = vocab.src_vocab || vocab.source_vocab || {};
  } else {
    srcVocab = vocab;
  }
  
  // Build target inverse vocab (IDs → Hindi tokens)
  const tgtVocab: Record<string, number> = vocab.tgt_vocab || vocab.target_vocab || vocab;
  tgtVocabInv = Object.fromEntries(
    Object.entries(tgtVocab).map(([k, v]) => [v as number, k])
  );

  // Load ONNX sessions
  onProgress?.(85, 'Loading encoder model…');
  encoderSession = await InferenceSession.create(
    modelDir + 'encoder_model.onnx',
    { executionProviders: ['cpu'] }
  );

  onProgress?.(93, 'Loading decoder model…');
  decoderSession = await InferenceSession.create(
    modelDir + 'decoder_model_merged.onnx',
    { executionProviders: ['cpu'] }
  );

  onProgress?.(100, 'Model ready!');
  modelReady = true;
}

export function isModelReady(): boolean {
  return modelReady;
}

// ── Simple BPE-style tokenizer ────────────────────────────────────────────────
// Lightweight fallback tokenizer for MarianMT
// For production: replace with sentencepiece WASM

function tokenize(text: string): number[] {
  // Normalize
  const normalized = text.toLowerCase().trim();
  
  // Simple word-piece style tokenization
  // MarianMT uses SentencePiece; this is a simplified version
  const words = normalized.split(/\s+/);
  const ids: number[] = [];
  
  for (const word of words) {
    // Try full word first
    if (srcVocab[word] !== undefined) {
      ids.push(srcVocab[word]);
    } else if (srcVocab['▁' + word] !== undefined) {
      ids.push(srcVocab['▁' + word]);
    } else {
      // Character-level fallback
      for (const char of word) {
        if (srcVocab[char] !== undefined) {
          ids.push(srcVocab[char]);
        } else {
          ids.push(srcVocab['<unk>'] ?? 1);
        }
      }
    }
  }
  
  return ids;
}

function detokenize(ids: number[]): string {
  const tokens = ids
    .filter(id => id !== EOS_TOKEN_ID && id !== PAD_TOKEN_ID && id !== BOS_TOKEN_ID)
    .map(id => tgtVocabInv[id] ?? '');
  
  // Join SentencePiece tokens (▁ = space prefix)
  return tokens
    .join('')
    .replace(/▁/g, ' ')
    .trim();
}

// ── Beam Search Translation ───────────────────────────────────────────────────

export async function translate(text: string): Promise<string> {
  if (!modelReady || !encoderSession || !decoderSession) {
    throw new Error('Model not loaded. Call loadTranslationModel() first.');
  }

  // Tokenize input
  const inputIds = tokenize(text);
  const seqLen = Math.min(inputIds.length, MAX_LENGTH);
  const paddedIds = inputIds.slice(0, seqLen);
  
  // Create attention mask (all 1s for non-padded)
  const attentionMask = new Array(seqLen).fill(1);
  
  // Create input tensors
  const inputIdsTensor = new Tensor(
    'int64',
    BigInt64Array.from(paddedIds.map(BigInt)),
    [1, seqLen]
  );
  const attentionMaskTensor = new Tensor(
    'int64',
    BigInt64Array.from(attentionMask.map(BigInt)),
    [1, seqLen]
  );

  // Run encoder
  const encoderOutput = await encoderSession.run({
    input_ids: inputIdsTensor,
    attention_mask: attentionMaskTensor,
  });

  const lastHiddenState = encoderOutput['last_hidden_state'];
  
  // Greedy decode
  const outputIds: number[] = [];
  let decoderInputIds = [BOS_TOKEN_ID];
  
  for (let step = 0; step < MAX_LENGTH; step++) {
    const decoderIdsTensor = new Tensor(
      'int64',
      BigInt64Array.from(decoderInputIds.map(BigInt)),
      [1, decoderInputIds.length]
    );
    
    const decoderMaskTensor = new Tensor(
      'int64',
      BigInt64Array.from(new Array(decoderInputIds.length).fill(BigInt(1))),
      [1, decoderInputIds.length]
    );

    const decoderOutput = await decoderSession.run({
      input_ids: decoderIdsTensor,
      encoder_hidden_states: lastHiddenState,
      encoder_attention_mask: attentionMaskTensor,
      attention_mask: decoderMaskTensor,
      use_cache_branch: new Tensor('bool', [step > 0], [1]),
    });

    const logits = decoderOutput['logits'];
    const logitsData = logits.data as Float32Array;
    
    // Get last token logits
    const vocabSize = logitsData.length / decoderInputIds.length;
    const lastTokenLogits = logitsData.slice(
      (decoderInputIds.length - 1) * vocabSize,
      decoderInputIds.length * vocabSize
    );
    
    // Argmax (greedy)
    let maxId = 0;
    let maxVal = lastTokenLogits[0];
    for (let i = 1; i < lastTokenLogits.length; i++) {
      if (lastTokenLogits[i] > maxVal) {
        maxVal = lastTokenLogits[i];
        maxId = i;
      }
    }
    
    if (maxId === EOS_TOKEN_ID) break;
    
    outputIds.push(maxId);
    decoderInputIds = [...decoderInputIds, maxId];
  }
  
  return detokenize(outputIds);
}
