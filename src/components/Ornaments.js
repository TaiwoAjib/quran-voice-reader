import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Traditional naskh-style Arabic rendering: Android falls back to Noto Naskh
// Arabic for the serif family; iOS uses its native Arabic system font.
export const ARABIC_FONT = Platform.select({ ios: 'Geeza Pro', android: 'serif' });

export const GOLD = '#C9A227';
export const EMERALD = '#0E7C5A';

/**
 * Eight-point star (khatam / rub el hizb) badge — the classic Islamic
 * geometric motif, drawn with two overlapping rotated squares.
 * Used for verse numbers and surah numbers.
 */
export function StarBadge({ size = 40, color = GOLD, filled = false, children }) {
  const sq = size * 0.72;
  const squareStyle = {
    position: 'absolute',
    width: sq,
    height: sq,
    borderWidth: 1.2,
    borderColor: color,
    borderRadius: size * 0.12,
    backgroundColor: filled ? `${color}1E` : 'transparent',
  };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={squareStyle} />
      <View style={[squareStyle, { transform: [{ rotate: '45deg' }] }]} />
      {children}
    </View>
  );
}

/**
 * Ornamental divider: ──── ۞ ──── (rub el hizb between two rules)
 */
export function OrnateDivider({ color = GOLD, symbol = '۞', style }) {
  return (
    <View style={[styles.dividerRow, style]}>
      <View style={[styles.dividerLine, { backgroundColor: `${color}55` }]} />
      <Text style={[styles.dividerSymbol, { color }]}>{symbol}</Text>
      <View style={[styles.dividerLine, { backgroundColor: `${color}55` }]} />
    </View>
  );
}

/**
 * A row of overlapping arches (mosque-arcade frieze) used as a decorative
 * header / footer trim. Only the upper half of each circle is shown.
 */
export function ArchFrieze({ color = GOLD, count = 11, height = 12, style }) {
  const d = height * 2;
  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'center', overflow: 'hidden', height }, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: d,
            height: d,
            borderRadius: height,
            borderWidth: 1,
            borderColor: `${color}66`,
            marginHorizontal: -height * 0.2,
            marginTop: 2,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  dividerSymbol: { fontSize: 18, lineHeight: 22 },
});
