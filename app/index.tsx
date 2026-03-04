import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

import { GlassCard } from '@/components/GlassCard';
import { ModelLoader } from '@/components/ModelLoader';
import {
  loadTranslationModel,
  translate,
  isModelReady,
} from '@/services/translationService';
import { saveTranslation } from '@/services/historyService';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  // Model state
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    isModelReady() ? 'ready' : 'idle'
  );
  const [modelProgress, setModelProgress] = useState(0);
  const [modelMessage, setModelMessage] = useState('');
  const [modelError, setModelError] = useState('');

  // ── Model Loading ──────────────────────────────────────────────────────────

  const handleLoadModel = useCallback(async () => {
    setModelStatus('loading');
    setModelProgress(0);
    setModelError('');

    try {
      await loadTranslationModel((progress, message) => {
        setModelProgress(progress);
        setModelMessage(message);
      });
      setModelStatus('ready');
    } catch (e: any) {
      setModelStatus('error');
      setModelError(e.message || 'Unknown error');
    }
  }, []);

  // ── Translation ────────────────────────────────────────────────────────────

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim() || isTranslating) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsTranslating(true);
    setOutputText('');

    try {
      const result = await translate(inputText.trim());
      setOutputText(result);
      await saveTranslation(inputText.trim(), result);
    } catch (e: any) {
      setOutputText('Translation error: ' + e.message);
    }

    setIsTranslating(false);
  }, [inputText, isTranslating]);

  // ── TTS ────────────────────────────────────────────────────────────────────

  const handleSpeak = useCallback(async () => {
    if (!outputText) return;

    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    Speech.speak(outputText.replace(/\[.*?\]/g, ''), {
      language: 'hi-IN',
      rate: 0.85,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  }, [outputText, isSpeaking]);

  // ── Copy ───────────────────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    if (!outputText) return;
    // Clipboard API
    const { setStringAsync } = await import('expo-clipboard');
    await setStringAsync(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [outputText]);

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoRing}>
              <Text style={styles.logoText}>अ</Text>
            </View>
            <Text style={styles.appName}>VaakAI</Text>
          </View>
          <View style={styles.offlineBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        </View>

        {/* Language Bar */}
        <View style={styles.langBar}>
          <View style={styles.langChip}>
            <Text style={styles.langFlag}>🇬🇧</Text>
            <Text style={styles.langText}>English</Text>
          </View>
          <View style={styles.arrowWrap}>
            <Text style={styles.arrowText}>→</Text>
          </View>
          <View style={styles.langChip}>
            <Text style={styles.langFlag}>🇮🇳</Text>
            <Text style={styles.langText}>Hindi</Text>
          </View>
        </View>

        {/* Model Loader */}
        <ModelLoader
          status={modelStatus}
          progress={modelProgress}
          message={modelMessage}
          onLoad={handleLoadModel}
          errorMsg={modelError}
        />

        {/* Input Card */}
        <GlassCard style={styles.inputCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>ENGLISH</Text>
            <Text style={styles.charCount}>{inputText.length}/500</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Enter English text…"
            placeholderTextColor={Colors.muted}
            value={inputText}
            onChangeText={(t) => setInputText(t.slice(0, 500))}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {inputText.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕ Clear</Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Translate Button */}
        <TouchableOpacity
          style={[
            styles.translateBtn,
            (!modelStatus || modelStatus !== 'ready' || !inputText.trim() || isTranslating) &&
              styles.translateBtnDisabled,
          ]}
          onPress={handleTranslate}
          disabled={modelStatus !== 'ready' || !inputText.trim() || isTranslating}
          activeOpacity={0.85}
        >
          {isTranslating ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#0F172A" />
              <Text style={styles.translateBtnText}>अनुवाद हो रहा है…</Text>
            </View>
          ) : (
            <Text style={styles.translateBtnText}>⚡  Translate to Hindi</Text>
          )}
        </TouchableOpacity>

        {/* Output Card */}
        <GlassCard style={styles.outputCard} accent={!!outputText}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>हिंदी (HINDI)</Text>
            <View style={styles.outputActions}>
              <TouchableOpacity
                style={[styles.iconBtn, copied && styles.iconBtnActive]}
                onPress={handleCopy}
                disabled={!outputText}
              >
                <Text style={styles.iconBtnText}>{copied ? '✅' : '📋'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, isSpeaking && styles.iconBtnActive]}
                onPress={handleSpeak}
                disabled={!outputText}
              >
                <Text style={styles.iconBtnText}>🔊</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isTranslating ? (
            <View style={styles.shimmerWrap}>
              <View style={[styles.shimmer, { width: '100%' }]} />
              <View style={[styles.shimmer, { width: '75%', marginTop: 8 }]} />
              <View style={[styles.shimmer, { width: '55%', marginTop: 8 }]} />
            </View>
          ) : outputText ? (
            <Text style={styles.outputText}>{outputText}</Text>
          ) : (
            <Text style={styles.outputPlaceholder}>Hindi translation will appear here…</Text>
          )}
        </GlassCard>

        {/* Bottom spacer for nav */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navBtn}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/history')}>
          <Text style={styles.navIcon}>📚</Text>
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/settings')}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingTop: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoRing: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(6,182,212,0.08)',
  },
  logoText: { fontSize: 17, color: Colors.text },
  appName: {
    fontSize: 22, fontWeight: '800',
    color: Colors.accent, letterSpacing: -0.5,
  },
  offlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(6,182,212,0.1)',
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.25)',
    borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4,
  },
  greenDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.green,
    shadowColor: Colors.green, shadowRadius: 4, shadowOpacity: 1,
  },
  offlineText: { fontSize: 12, color: Colors.accent, fontWeight: '500' },

  langBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 14, marginBottom: 14,
  },
  langChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 8,
  },
  langFlag: { fontSize: 16 },
  langText: { fontSize: 13, color: '#CBD5E1', fontWeight: '500' },
  arrowWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  arrowText: { fontSize: 16, color: Colors.accent },

  inputCard: { marginBottom: 14 },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  cardLabel: {
    fontSize: 10, fontWeight: '700',
    color: '#64748B', letterSpacing: 1.2,
  },
  charCount: { fontSize: 11, color: Colors.muted },
  textInput: {
    color: Colors.text, fontSize: 16, lineHeight: 24,
    minHeight: 90,
  },
  clearBtn: { marginTop: 8 },
  clearBtnText: { fontSize: 12, color: Colors.muted },

  translateBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  translateBtnDisabled: {
    backgroundColor: '#0E7490',
    shadowOpacity: 0.1,
    opacity: 0.7,
  },
  translateBtnText: {
    color: '#0F172A',
    fontSize: 16, fontWeight: '800', letterSpacing: 0.3,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  outputCard: { marginBottom: 14 },
  outputActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 34, height: 34,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(6,182,212,0.15)',
    borderColor: 'rgba(6,182,212,0.35)',
  },
  iconBtnText: { fontSize: 15 },
  outputText: {
    color: Colors.text, fontSize: 17, lineHeight: 28,
    fontFamily: 'System',
  },
  outputPlaceholder: { color: Colors.dark, fontSize: 15, lineHeight: 22 },
  shimmerWrap: { gap: 0 },
  shimmer: {
    height: 16, borderRadius: 8,
    backgroundColor: 'rgba(45,63,85,0.8)',
  },

  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: 'rgba(15,23,42,0.97)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10, paddingBottom: 24,
  },
  navBtn: { alignItems: 'center', gap: 3, paddingHorizontal: 24 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 10, color: Colors.muted },
  navLabelActive: { color: Colors.accent },
});
