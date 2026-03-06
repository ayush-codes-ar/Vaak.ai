/**
 * VaakAI Translation Service
 * Real offline neural machine translation using MarianMT ONNX model
 * English → Hindi (Helsinki-NLP/opus-mt-en-hi)
 */

import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as FileSystem from 'expo-file-system';

let encoderSession: InferenceSession | null = null;
let decoderSession: InferenceSession | null = null;
let vocab: Record<string, number> = {};
let idToToken: Record<string, string> = {};
let modelReady = false;

export function isModelReady(): boolean {
  return modelReady;
}

async function copyAndroidAssetToCache(filename: string): Promise<string> {
  const dirPath = FileSystem.cacheDirectory + 'models/';
  const destPath = dirPath + filename;

  const dirInfo = await FileSystem.getInfoAsync(dirPath);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  }

  const fileInfo = await FileSystem.getInfoAsync(destPath);
  if (fileInfo.exists && (fileInfo as any).size > 1000) {
    return destPath;
  }

  await FileSystem.copyAsync({ from: `asset:///models/${filename}`, to: destPath });
  return destPath;
}

function tokenize(text: string): number[] {
  const tokens: number[] = [];
  // DO NOT lowercase - model is case sensitive
  const normalized = text.trim();
  const words = normalized.split(/\s+/);

  for (const word of words) {
    // Try ▁Word first (exact case)
    const wpWord = '\u2581' + word;
    if (vocab[wpWord] !== undefined) {
      tokens.push(vocab[wpWord]);
      continue;
    }

    // Try ▁word (lowercase fallback)
    const wpLower = '\u2581' + word.toLowerCase();
    if (vocab[wpLower] !== undefined) {
      tokens.push(vocab[wpLower]);
      continue;
    }

    // Subword tokenization
    let remaining = word;
    let isFirst = true;
    while (remaining.length > 0) {
      let found = false;
      for (let len = Math.min(remaining.length, 20); len > 0; len--) {
        const sub = (isFirst ? '\u2581' : '') + remaining.slice(0, len);
        const subLower = (isFirst ? '\u2581' : '') + remaining.slice(0, len).toLowerCase();
        if (vocab[sub] !== undefined) {
          tokens.push(vocab[sub]);
          remaining = remaining.slice(len);
          found = true;
          isFirst = false;
          break;
        } else if (vocab[subLower] !== undefined) {
          tokens.push(vocab[subLower]);
          remaining = remaining.slice(len);
          found = true;
          isFirst = false;
          break;
        }
      }
      if (!found) {
        tokens.push(vocab['<unk>'] ?? 3);
        remaining = remaining.slice(1);
        isFirst = false;
      }
    }
  }

  tokens.push(vocab['</s>'] ?? 0);
  return tokens;
}

function decodeTokens(ids: string[]): string {
  let result = '';
  for (const id of ids) {
    const token = idToToken[id];
    if (!token) continue;
    if (token === '</s>' || token === '<pad>' || token === '<unk>') continue;
    if (token.startsWith('\u2581')) {
      result += ' ' + token.slice(1);
    } else {
      result += token;
    }
  }
  return result.trim();
}

async function runEncoder(inputIds: number[]): Promise<{ hidden: Float32Array; seqLen: number }> {
  if (!encoderSession) throw new Error('Encoder not loaded');
  const seqLen = inputIds.length;
  const results = await encoderSession.run({
    input_ids: new Tensor('int64', BigInt64Array.from(inputIds.map(BigInt)), [1, seqLen]),
    attention_mask: new Tensor('int64', BigInt64Array.from(new Array(seqLen).fill(1n)), [1, seqLen]),
  });
  return { hidden: results['last_hidden_state'].data as Float32Array, seqLen };
}

async function runDecoderStep(
  decoderInputIds: number[],
  encoderHidden: Float32Array,
  encoderSeqLen: number
): Promise<Float32Array> {
  if (!decoderSession) throw new Error('Decoder not loaded');
  const decSeqLen = decoderInputIds.length;
  const hiddenSize = encoderHidden.length / encoderSeqLen;
  const results = await decoderSession.run({
    input_ids: new Tensor('int64', BigInt64Array.from(decoderInputIds.map(BigInt)), [1, decSeqLen]),
    encoder_hidden_states: new Tensor('float32', encoderHidden, [1, encoderSeqLen, hiddenSize]),
    encoder_attention_mask: new Tensor('int64', BigInt64Array.from(new Array(encoderSeqLen).fill(1n)), [1, encoderSeqLen]),
  });
  const logits = results['logits'].data as Float32Array;
  const vocabSize = logits.length / decSeqLen;
  return logits.slice((decSeqLen - 1) * vocabSize, decSeqLen * vocabSize);
}

function argmax(arr: Float32Array): number {
  let maxIdx = 0, maxVal = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > maxVal) { maxVal = arr[i]; maxIdx = i; }
  }
  return maxIdx;
}

async function translateWithModel(text: string): Promise<string> {
  const inputIds = tokenize(text);
  if (inputIds.length === 0) throw new Error('Could not tokenize input');

  const { hidden: encoderHidden, seqLen: encoderSeqLen } = await runEncoder(inputIds);

  const padId = vocab['<pad>'] ?? 62000;
  const eosId = vocab['</s>'] ?? 0;
  const outputIds: number[] = [padId];

  for (let step = 0; step < 128; step++) {
    const logits = await runDecoderStep(outputIds, encoderHidden, encoderSeqLen);
    const nextId = argmax(logits);
    if (nextId === eosId) break;
    outputIds.push(nextId);
  }

  return decodeTokens(outputIds.slice(1).map(String)) || 'Translation not available';
}

export async function loadTranslationModel(
  onProgress?: (progress: number, message: string) => void
): Promise<void> {
  try {
    onProgress?.(0.05, 'Preparing model files...');

    onProgress?.(0.1, 'Copying encoder to cache...');
    const encoderPath = await copyAndroidAssetToCache('encoder_model.onnx');

    onProgress?.(0.4, 'Copying decoder to cache...');
    const decoderPath = await copyAndroidAssetToCache('decoder_model.onnx');

    onProgress?.(0.6, 'Loading vocabulary...');
    const vocabPath = await copyAndroidAssetToCache('vocab.json');
    const vocabContent = await FileSystem.readAsStringAsync(vocabPath);
    vocab = JSON.parse(vocabContent);

    onProgress?.(0.65, 'Loading target vocabulary...');
    const targetVocabPath = await copyAndroidAssetToCache('target_vocab.json');
    const targetVocabContent = await FileSystem.readAsStringAsync(targetVocabPath);
    idToToken = JSON.parse(targetVocabContent);

    onProgress?.(0.7, 'Initializing encoder...');
    encoderSession = await InferenceSession.create(encoderPath, {
      executionProviders: ['cpu'],
    });

    onProgress?.(0.88, 'Initializing decoder...');
    decoderSession = await InferenceSession.create(decoderPath, {
      executionProviders: ['cpu'],
    });

    modelReady = true;
    onProgress?.(1.0, 'Model ready!');
  } catch (e: any) {
    modelReady = false;
    throw new Error('Failed to load model: ' + e.message);
  }
}

export async function translate(text: string): Promise<string> {
  if (!modelReady || !encoderSession || !decoderSession) {
    throw new Error('Model not loaded. Please load the model first.');
  }
  if (!text.trim()) return '';
  return await translateWithModel(text.trim());
}
