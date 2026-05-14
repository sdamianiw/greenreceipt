import { ScrollView, StyleSheet, Text } from 'react-native';
import { palette, fonts } from '../theme/chemtrace';
import { de } from '../locales/de';
import type { RootStackScreenProps } from '../types/navigation';

export default function VerdictScreen({
  route,
}: RootStackScreenProps<'Verdict'>) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{de.verdict.heading}</Text>
      <Text style={styles.json}>{JSON.stringify(route.params.verdict, null, 2)}</Text>
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
    gap: 12,
  },
  heading: {
    fontFamily: fonts.display,
    color: palette.cream,
    fontSize: 24,
  },
  json: {
    fontFamily: fonts.mono,
    color: palette.cream,
    fontSize: 13,
    lineHeight: 18,
  },
});
