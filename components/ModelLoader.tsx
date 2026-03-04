import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { GlassCard } from './GlassCard';
import { Colors, Radius } from '@/constants/theme';

interface ModelLoaderProps {
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: number;
  message: string;
  onLoad: () => void;
  errorMsg?: string;
}

export function ModelLoader({
  status,
  progress,
  message,
  onLoad,
  errorMsg,
}: ModelLoaderProps) {
  if (status === 'ready') return null;

  return (
    <GlassCard style={styles.card} accent>
      <View style={styles.header}>
        <Text style={styles.icon}>🤖</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>MarianMT ONNX Model</Text>
          <Text style={styles.subtitle}>Helsinki-NLP/opus-mt-en-hi · int8 quantized · ~30MB</Text>
        </View>
      </View>

      {status === 'idle' && (
        <>
          <Text style={styles.desc}>
            Downloads once from Hugging Face → cached locally forever.{'\n'}
            Works fully offline after first download.
          </Text>
          <TouchableOpacity style={styles.loadBtn} onPress={onLoad} activeOpacity={0.85}>
            <Text style={styles.loadBtnText}>⬇  Download & Load AI Model</Text>
          </TouchableOpacity>
        </>
      )}

      {status === 'loading' && (
        <View style={styles.progressWrap}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel} numberOfLines={1}>{message}</Text>
            <Text style={styles.progressPct}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Downloading & initializing…</Text>
          </View>
        </View>
      )}

      {status === 'error' && (
        <>
          <Text style={styles.errorText}>❌ {errorMsg || 'Download failed'}</Text>
          <TouchableOpacity style={styles.loadBtn} onPress={onLoad} activeOpacity={0.85}>
            <Text style={styles.loadBtnText}>🔄 Retry</Text>
          </TouchableOpacity>
        </>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  icon: { fontSize: 28 },
  headerText: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.accent, marginBottom: 2 },
  subtitle: { fontSize: 11, color: Colors.muted, lineHeight: 16 },
  desc: { fontSize: 13, color: Colors.sub, lineHeight: 19, marginBottom: 14 },
  loadBtn: {
    backgroundColor: 'rgba(6,182,212,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.3)',
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
  },
  loadBtnText: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
  progressWrap: { gap: 8 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 11, color: Colors.muted, flex: 1 },
  progressPct: { fontSize: 11, color: Colors.accent, fontWeight: '600' },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  statusText: { fontSize: 11, color: Colors.sub },
  errorText: { fontSize: 13, color: Colors.error, marginBottom: 12 },
});
