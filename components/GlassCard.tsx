import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accent?: boolean;
}

export function GlassCard({ children, style, accent }: GlassCardProps) {
  return (
    <View style={[styles.card, accent && styles.accent, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(17,24,39,0.97)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  accent: {
    borderColor: 'rgba(6,182,212,0.25)',
    shadowColor: Colors.accent,
    shadowOpacity: 0.15,
  },
});
