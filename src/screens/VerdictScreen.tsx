import { ScrollView, StyleSheet, Text } from 'react-native';
import { palette, fonts } from '../theme/chemtrace';
import { de } from '../locales/de';
import { VerdictBadge } from '../components/VerdictBadge';
import type { RootStackScreenProps } from '../types/navigation';

export default function VerdictScreen({
  route,
}: RootStackScreenProps<'Verdict'>) {
  const { verdict } = route.params;
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <VerdictBadge verdict={verdict.verdict} />
      <Text style={styles.label}>{de.verdict.confidenceLabel}</Text>
      <Text style={styles.value}>
        {Math.round(verdict.confidence * 100)}%
      </Text>
      <Text style={styles.label}>{de.verdict.reasoningLabel}</Text>
      <Text style={styles.value}>{verdict.reasoning}</Text>
      <Text style={styles.label}>{de.verdict.evidenceLabel}</Text>
      {verdict.evidence_points.map((point, i) => (
        <Text key={i} style={styles.evidence}>
          • {point}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 8,
  },
  heading: {
    fontFamily: fonts.display,
    color: palette.cream,
    fontSize: 24,
  },
  label: {
    fontFamily: fonts.body,
    color: palette.creamDim,
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: fonts.body,
    color: palette.cream,
    fontSize: 15,
    lineHeight: 22,
  },
  evidence: {
    fontFamily: fonts.body,
    color: palette.cream,
    fontSize: 14,
    lineHeight: 20,
  },
});
