import { StyleSheet, Text, View } from 'react-native';
import { palette, fonts } from '../theme/chemtrace';
import type { Verdict } from '../types/verdict';

const verdictColor: Record<Verdict, string> = {
  Vague: palette.cream,
  Verifiable: palette.blue,
  Unsupported: palette.rust,
  Substantiated: palette.blue,
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const color = verdictColor[verdict];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.label, { color }]}>{verdict}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: palette.terminalBg,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 14,
    letterSpacing: 1,
  },
});
