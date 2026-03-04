import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
} from 'react-native';
import { Colors, Radius } from '@/constants/theme';

interface PinInputProps {
  onComplete: (pin: string) => void;
  error?: string;
}

export function PinInput({ onComplete, error }: PinInputProps) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const refs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const handleChange = (idx: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);

    if (clean && idx < 3) {
      refs[idx + 1].current?.focus();
    }

    if (next.every((d) => d !== '')) {
      onComplete(next.join(''));
    }
  };

  const handleKeyPress = (idx: number, key: string) => {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits];
      next[idx - 1] = '';
      setDigits(next);
      refs[idx - 1].current?.focus();
    }
  };

  // Reset on error
  React.useEffect(() => {
    if (error) {
      setDigits(['', '', '', '']);
      refs[0].current?.focus();
    }
  }, [error]);

  return (
    <View>
      <View style={styles.row}>
        {digits.map((d, i) => (
          <TextInput
            key={i}
            ref={refs[i]}
            value={d}
            onChangeText={(v) => handleChange(i, v)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={1}
            style={[styles.box, error ? styles.boxError : null]}
            selectionColor={Colors.accent}
            autoFocus={i === 0}
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
  },
  box: {
    width: 62,
    height: 72,
    backgroundColor: 'rgba(17,24,39,0.97)',
    borderWidth: 2,
    borderColor: 'rgba(6,182,212,0.3)',
    borderRadius: Radius.md,
    color: Colors.text,
    fontSize: 28,
    textAlign: 'center',
  },
  boxError: {
    borderColor: Colors.error,
  },
  error: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    fontFamily: 'System',
  },
});
