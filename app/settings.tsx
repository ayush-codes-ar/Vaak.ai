import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { GlassCard } from '@/components/GlassCard';
import { PinInput } from '@/components/PinInput';
import {
  isHistoryEnabled, setHistoryEnabled,
  getPin, setPin, verifyPin,
} from '@/services/historyService';
import { Colors, Radius, Spacing } from '@/constants/theme';

type PinMode = 'none' | 'setup' | 'setup-confirm' | 'change-old' | 'change-new' | 'change-confirm';

export default function SettingsScreen() {
  const [histEnabled, setHistEnabled] = useState(false);
  const [pinMode, setPinMode] = useState<PinMode>('none');
  const [tempPin, setTempPin] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    isHistoryEnabled().then(setHistEnabled);
  }, []);

  const handleToggleHistory = async () => {
    if (!histEnabled) {
      const pin = await getPin();
      if (!pin) { setPinMode('setup'); setPinError(''); return; }
      await setHistoryEnabled(true);
      setHistEnabled(true);
    } else {
      await setHistoryEnabled(false);
      setHistEnabled(false);
    }
  };

  // PIN FLOWS
  const handleSetup = (pin: string) => { setTempPin(pin); setPinMode('setup-confirm'); setPinError(''); };
  const handleSetupConfirm = async (pin: string) => {
    if (pin === tempPin) {
      await setPin(pin); await setHistoryEnabled(true);
      setHistEnabled(true); setPinMode('none'); setPinError('');
    } else {
      setPinError('PIN मेल नहीं खाता।'); setPinMode('setup'); setTempPin('');
    }
  };
  const handleChangeOld = async (pin: string) => {
    const ok = await verifyPin(pin);
    if (ok) { setPinMode('change-new'); setPinError(''); }
    else { setPinError('गलत PIN।'); }
  };
  const handleChangeNew = (pin: string) => { setTempPin(pin); setPinMode('change-confirm'); setPinError(''); };
  const handleChangeConfirm = async (pin: string) => {
    if (pin === tempPin) {
      await setPin(pin); setPinMode('none'); setPinError('');
    } else {
      setPinError('PIN मेल नहीं खाता।'); setPinMode('change-new'); setTempPin('');
    }
  };

  // PIN sub-screens
  if (pinMode !== 'none') {
    const configs: Record<PinMode, { icon: string; title: string; sub: string; handler: (p: string) => void }> = {
      setup:          { icon: '🔑', title: 'Create PIN',   sub: 'एक नया 4-अंकीय PIN बनाएं', handler: handleSetup },
      'setup-confirm':{ icon: '🔑', title: 'Confirm PIN',  sub: 'PIN की पुष्टि करें',        handler: handleSetupConfirm },
      'change-old':   { icon: '🔐', title: 'Current PIN',  sub: 'पुराना PIN दर्ज करें',       handler: handleChangeOld },
      'change-new':   { icon: '🔑', title: 'New PIN',      sub: 'नया PIN बनाएं',              handler: handleChangeNew },
      'change-confirm':{ icon: '🔑', title: 'Confirm PIN', sub: 'नए PIN की पुष्टि करें',       handler: handleChangeConfirm },
      none:           { icon: '', title: '', sub: '', handler: () => {} },
    };
    const cfg = configs[pinMode];
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pinScreen}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { setPinMode('none'); setPinError(''); }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.pinIcon}>{cfg.icon}</Text>
          <Text style={styles.pinTitle}>{cfg.title}</Text>
          <Text style={styles.pinSub}>{cfg.sub}</Text>
          <PinInput onComplete={cfg.handler} error={pinError} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Privacy */}
        <Text style={styles.sectionLabel}>PRIVACY</Text>
        <GlassCard style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingName}>Secure History</Text>
            <Text style={styles.settingDesc}>PIN-protected translation history</Text>
          </View>
          <Switch
            value={histEnabled}
            onValueChange={handleToggleHistory}
            trackColor={{ false: '#1E293B', true: Colors.accent }}
            thumbColor="#F8FAFC"
          />
        </GlassCard>

        {/* Security */}
        {histEnabled && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>SECURITY</Text>
            <TouchableOpacity onPress={() => { setPinMode('change-old'); setPinError(''); }}>
              <GlassCard style={styles.settingBtn}>
                <Text style={styles.settingBtnText}>Change PIN →</Text>
              </GlassCard>
            </TouchableOpacity>
          </>
        )}

        {/* AI Model */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>AI MODEL</Text>
        <GlassCard>
          <AboutRow icon="🤖" text="Helsinki-NLP/opus-mt-en-hi (MarianMT)" />
          <AboutRow icon="⚡" text="ONNX int8 quantized — native on-device inference" />
          <AboutRow icon="💾" text="~30MB — cached after first download" last />
        </GlassCard>

        {/* About */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>ABOUT</Text>
        <GlassCard>
          <AboutRow icon="🔒" text="Runs fully offline after first load" />
          <AboutRow icon="🚫" text="No data leaves your device" />
          <AboutRow icon="📡" text="No APIs, no analytics, no accounts" />
          <AboutRow icon="📱" text="Version 1.0.0 — Hackathon Build" last />
        </GlassCard>

        {/* Quote */}
        <GlassCard style={styles.quote} accent>
          <Text style={styles.quoteText}>
            "This entire AI translation system runs fully offline on-device. No cloud. No API. Pure neural inference."
          </Text>
        </GlassCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function AboutRow({ icon, text, last }: { icon: string; text: string; last?: boolean }) {
  return (
    <View style={[aboutStyles.row, !last && aboutStyles.rowBorder]}>
      <Text style={aboutStyles.icon}>{icon}</Text>
      <Text style={aboutStyles.text}>{text}</Text>
    </View>
  );
}

const aboutStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  icon: { fontSize: 16 },
  text: { fontSize: 14, color: Colors.sub, flex: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: Spacing.md, paddingBottom: 12,
  },
  backText: { color: Colors.muted, fontSize: 14 },
  pageTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  content: { padding: Spacing.md },
  sectionLabel: {
    fontSize: 10, fontWeight: '700',
    color: Colors.muted, letterSpacing: 1.2, marginBottom: 10, paddingLeft: 4,
  },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: { flex: 1 },
  settingName: { fontSize: 15, color: Colors.text, marginBottom: 2 },
  settingDesc: { fontSize: 12, color: Colors.muted },
  settingBtn: { padding: 16 },
  settingBtnText: { fontSize: 15, color: Colors.accent },
  quote: { marginTop: 20 },
  quoteText: {
    fontSize: 13, color: Colors.sub,
    fontStyle: 'italic', lineHeight: 20, textAlign: 'center',
  },
  pinScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl,
  },
  backBtn: { position: 'absolute', top: 20, left: 20 },
  pinIcon: { fontSize: 54, marginBottom: 20 },
  pinTitle: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  pinSub: { fontSize: 14, color: Colors.muted, marginBottom: 36, textAlign: 'center' },
});
