import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface HistoryEntry {
  id: string;
  source: string;
  target: string;
  timestamp: string;
}

const HISTORY_KEY = 'vaakai_history';
const HISTORY_ENABLED_KEY = 'vaakai_hist_enabled';
const PIN_KEY = 'vaakai_pin';

// ── PIN ──────────────────────────────────────────────────────────────────────

export async function getPin(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PIN_KEY);
  } catch {
    return null;
  }
}

export async function setPin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await getPin();
  return stored === pin;
}

// ── HISTORY ENABLED ──────────────────────────────────────────────────────────

export async function isHistoryEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(HISTORY_ENABLED_KEY);
  return val === 'true';
}

export async function setHistoryEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(HISTORY_ENABLED_KEY, enabled ? 'true' : 'false');
}

// ── HISTORY CRUD ─────────────────────────────────────────────────────────────

export async function saveTranslation(
  source: string,
  target: string
): Promise<void> {
  const enabled = await isHistoryEnabled();
  if (!enabled) return;

  const all = await getAllHistory();
  const entry: HistoryEntry = {
    id: Date.now().toString(),
    source,
    target,
    timestamp: new Date().toISOString(),
  };
  all.unshift(entry);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(all.slice(0, 100)));
}

export async function getAllHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function deleteEntry(id: string): Promise<void> {
  const all = await getAllHistory();
  const filtered = all.filter((e) => e.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}

export async function clearAllHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

// ── UTILS ────────────────────────────────────────────────────────────────────

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );
}
