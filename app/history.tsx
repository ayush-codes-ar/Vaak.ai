import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { PinInput } from '@/components/PinInput';
import { GlassCard } from '@/components/GlassCard';
import {
  getAllHistory, deleteEntry, clearAllHistory,
  isHistoryEnabled, getPin, setPin, setHistoryEnabled,
  formatTimestamp, HistoryEntry,
} from '@/services/historyService';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Mode = 'check' | 'setup' | 'setup-confirm' | 'unlocked' | 'disabled';

export default function HistoryScreen() {
  const [mode, setMode] = useState<Mode>('check');
  const [pinError, setPinError] = useState('');
  const [tempPin, setTempPin] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    initScreen();
  }, []);

  const initScreen = async () => {
    const enabled = await isHistoryEnabled();
    if (!enabled) { setMode('disabled'); return; }
    const pin = await getPin();
    if (!pin) { setMode('setup'); return; }
    setMode('check');
  };

  const handleVerify = async (pin: string) => {
    const ok = await (await import('@/services/historyService')).verifyPin(pin);
    if (ok) {
      setPinError('');
      const h = await getAllHistory();
      setHistory(h);
      setMode('unlocked');
    } else {
      setPinError('गलत PIN। पुनः प्रयास करें।');
    }
  };

  const handleSetup = (pin: string) => {
    setTempPin(pin);
    setMode('setup-confirm');
    setPinError('');
  };

  const handleConfirm = async (pin: string) => {
    if (pin === tempPin) {
      await setPin(pin);
      await setHistoryEnabled(true);
      setPinError('');
      const h = await getAllHistory();
      setHistory(h);
      setMode('unlocked');
    } else {
      setPinError('PIN मेल नहीं खाता। पुनः प्रयास करें।');
      setMode('setup');
      setTempPin('');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    setHistory((prev) => prev.filter((e) => e.id !== id));
  };

  const handleClearAll = () => {
    Alert.alert('Clear All History', 'Delete all saved translations?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All', style: 'destructive',
        onPress: async () => {
          await clearAllHistory();
          setHistory([]);
        },
      },
    ]);
  };

  // ── PIN Screens ──────────────────────────────────────────────────────────

  if (mode === 'disabled') return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pinScreen}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pinIcon}>📭</Text>
        <Text style={styles.pinTitle}>History Disabled</Text>
        <Text style={styles.pinSub}>Enable Secure History in Settings to save translations.</Text>
        <TouchableOpacity style={styles.goSettingsBtn} onPress={() => router.push('/settings')}>
          <Text style={styles.goSettingsText}>Go to Settings →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (mode === 'check') return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pinScreen}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pinIcon}>🔐</Text>
        <Text style={styles.pinTitle}>Enter PIN</Text>
        <Text style={styles.pinSub}>अपना 4-अंकीय PIN दर्ज करें</Text>
        <PinInput onComplete={handleVerify} error={pinError} />
      </View>
    </SafeAreaView>
  );

  if (mode === 'setup') return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pinScreen}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pinIcon}>🔑</Text>
        <Text style={styles.pinTitle}>Create PIN</Text>
        <Text style={styles.pinSub}>एक नया 4-अंकीय PIN बनाएं</Text>
        <PinInput onComplete={handleSetup} error={pinError} />
      </View>
    </SafeAreaView>
  );

  if (mode === 'setup-confirm') return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pinScreen}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pinIcon}>🔑</Text>
        <Text style={styles.pinTitle}>Confirm PIN</Text>
        <Text style={styles.pinSub}>PIN की पुष्टि करें</Text>
        <PinInput onComplete={handleConfirm} error={pinError} />
      </View>
    </SafeAreaView>
  );

  // ── History List ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>History</Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={styles.clearAll}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {history.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No translations yet</Text>
            <Text style={styles.emptySub}>Your history will appear here</Text>
          </View>
        ) : (
          history.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              onPress={() => setExpanded(expanded === entry.id ? null : entry.id)}
              activeOpacity={0.8}
            >
              <GlassCard style={styles.histCard}>
                <View style={styles.histTop}>
                  <Text style={styles.histSrc} numberOfLines={expanded === entry.id ? 0 : 1}>
                    {entry.source}
                  </Text>
                  <TouchableOpacity onPress={() => handleDelete(entry.id)}>
                    <Text style={styles.delBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                {expanded === entry.id ? (
                  <View style={styles.histExpanded}>
                    <View style={styles.divider} />
                    <Text style={styles.histTarget}>{entry.target}</Text>
                    <Text style={styles.histTime}>{formatTimestamp(entry.timestamp)}</Text>
                  </View>
                ) : (
                  <Text style={styles.histPrev} numberOfLines={1}>{entry.target}</Text>
                )}
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: Spacing.md, paddingBottom: 12,
  },
  backText: { color: Colors.muted, fontSize: 14 },
  pageTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  clearAll: { color: Colors.error, fontSize: 13 },
  list: { padding: Spacing.md },

  histCard: { marginBottom: 10 },
  histTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  histSrc: { fontSize: 13, color: Colors.sub, flex: 1, paddingRight: 8, lineHeight: 18 },
  delBtn: { color: Colors.muted, fontSize: 13 },
  histPrev: { fontSize: 15, color: '#CBD5E1', marginTop: 6 },
  histExpanded: { marginTop: 10 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 10 },
  histTarget: {
    fontSize: 16, color: Colors.text, lineHeight: 26,
    marginBottom: 8,
  },
  histTime: { fontSize: 11, color: Colors.muted },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 16, color: Colors.muted, marginBottom: 6 },
  emptySub: { fontSize: 13, color: Colors.dark },

  pinScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl,
  },
  backBtn: { position: 'absolute', top: 20, left: 20 },
  pinIcon: { fontSize: 54, marginBottom: 20 },
  pinTitle: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  pinSub: { fontSize: 14, color: Colors.muted, marginBottom: 36, textAlign: 'center' },
  goSettingsBtn: {
    marginTop: 24, backgroundColor: 'rgba(6,182,212,0.1)',
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.3)',
    borderRadius: Radius.md, paddingHorizontal: 24, paddingVertical: 12,
  },
  goSettingsText: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
});
