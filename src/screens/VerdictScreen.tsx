import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette, fonts } from '../theme/chemtrace';
import { de } from '../locales/de';
import { VerdictBadge } from '../components/VerdictBadge';
import type { RootStackScreenProps } from '../types/navigation';

export default function VerdictScreen({
  route,
}: RootStackScreenProps<'Verdict'>) {
  const { verdict } = route.params;
  const confidencePercent = Math.round(
    Math.max(0, Math.min(1, verdict.confidence)) * 100,
  );
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.brand}>{de.app.name}</Text>
        <VerdictBadge verdict={verdict.verdict} />

        <View style={styles.section}>
          <Text style={styles.label}>{de.verdict.confidenceLabel}</Text>
          <View style={styles.confidenceRow}>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  { width: `${confidencePercent}%` },
                ]}
              />
            </View>
            <Text style={styles.confidenceValue}>{confidencePercent}%</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{de.verdict.reasoningLabel}</Text>
          <Text style={styles.reasoning}>{verdict.reasoning}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{de.verdict.evidenceLabel}</Text>
          <View style={styles.chipsBlock}>
            {verdict.evidence_points.map((point, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.disclaimer}>{de.verdict.disclaimer}</Text>

        <Text style={styles.telemetry}>
          {verdict.model_used} · {verdict.tokens_used} {de.verdict.tokensLabel}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: palette.terminalBg,
    borderColor: palette.creamDim,
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
    gap: 16,
  },
  brand: {
    fontFamily: fonts.display,
    color: palette.creamDim,
    fontSize: 14,
    letterSpacing: 1,
  },
  section: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.body,
    color: palette.creamDim,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: palette.bg,
    borderColor: palette.creamDim,
    borderWidth: 1,
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: palette.cream,
  },
  confidenceValue: {
    fontFamily: fonts.mono,
    color: palette.cream,
    fontSize: 13,
    minWidth: 40,
    textAlign: 'right',
  },
  reasoning: {
    fontFamily: fonts.body,
    color: palette.cream,
    fontSize: 15,
    lineHeight: 22,
  },
  chipsBlock: {
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: palette.creamDim,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: palette.bg,
  },
  chipText: {
    fontFamily: fonts.body,
    color: palette.cream,
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: palette.creamDim,
  },
  disclaimer: {
    fontFamily: fonts.body,
    color: palette.creamDim,
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  telemetry: {
    fontFamily: fonts.mono,
    color: palette.creamDim,
    fontSize: 11,
  },
});
