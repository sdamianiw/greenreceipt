import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette, fonts } from '../theme/chemtrace';
import { de } from '../locales/de';
import { VerdictBadge } from '../components/VerdictBadge';
import type { RootStackScreenProps } from '../types/navigation';
import type { Verdict } from '../types/verdict';

const confidenceColor: Record<Verdict, string> = {
  Vague: '#F5A524',
  Verifiable: palette.blue,
  Unsupported: palette.rust,
  Substantiated: '#62C28E',
};

const ASCII_PRINTABLE = /^[\x20-\x7E]+$/;
const isCleanEnglishChip = (p: string) =>
  ASCII_PRINTABLE.test(p) &&
  (p.match(/[a-zA-Z]{3,}/g) || []).length >= 2 &&
  p.length >= 8 &&
  p.length <= 80;

const numberLike = /%|percent|\d+/i;
const certPositiveRe =
  /\b(FSC|ISO\s*\d|EU\s*Ecolabel|ClimatePartner|Rainforest\s*Alliance|Fair\s*Trade|certified|certification|standard|seal)\b/i;
const certNegationRe =
  /\b(no|without|lacks?|lacking|missing|absent|not)\s+(?:any\s+)?(?:external\s+|third[- ]party\s+|independent\s+)?(certification|certifications|standard|standards|cert(?:ified)?|seal|seals|label|labels)\b/i;

type ClaimSources = { reasoning: string; evidence_points: string[] };

const RECYCLED_NOUNS =
  'plastic|material|content|packaging|paper|aluminum|aluminium|glass|cardboard|fiber|fibre';

function deriveAssessedClaim(v: ClaimSources, fallback: string): string {
  const haystack = [v.reasoning, ...v.evidence_points].join(' ');

  // (a) percentage + recycled <material>
  const rePctRecycled = new RegExp(
    `(\\d{1,3})\\s*%\\s*(?:of\\s+)?(?:recycled\\s+)(${RECYCLED_NOUNS})`,
    'i',
  );
  const reRecycledPct = new RegExp(
    `recycled\\s+(${RECYCLED_NOUNS})[^%]{0,20}?(\\d{1,3})\\s*%`,
    'i',
  );
  let m = rePctRecycled.exec(haystack);
  if (m) return `${m[1]}% recycled ${m[2].toLowerCase()}`;
  m = reRecycledPct.exec(haystack);
  if (m) return `${m[2]}% recycled ${m[1].toLowerCase()}`;

  // (b) CO2 / emission reduction with %
  const reCo2 =
    /(\d{1,3})\s*%\s*(?:CO2?|carbon|emission|emissions)\s*(?:reduction|cut|less|lower)?/i;
  m = reCo2.exec(haystack);
  if (m) return `${m[1]}% CO2 reduction`;

  // (c) generic percentage + nearby noun (best-effort, max 60 chars)
  const reGenericPct = /(\d{1,3})\s*%\s*(?:of\s+)?([A-Za-z][A-Za-z\s-]{2,40})/;
  m = reGenericPct.exec(haystack);
  if (m) {
    const noun = m[2].trim().split(/\s+/).slice(0, 3).join(' ').toLowerCase();
    return `${m[1]}% ${noun}`.slice(0, 60);
  }

  // (d) certification / standard markers
  if (/\bFSC\b/i.test(haystack)) return 'FSC certified';
  const iso = /\bISO\s*(\d{4,5})/i.exec(haystack);
  if (iso) return `ISO ${iso[1]}`;
  if (/\bEU\s*Ecolabel\b/i.test(haystack)) return 'EU Ecolabel';
  if (/\bClimatePartner\b/i.test(haystack)) return 'ClimatePartner';
  if (/\bRainforest\s*Alliance\b/i.test(haystack)) return 'Rainforest Alliance';
  if (/\bFair\s*Trade\b/i.test(haystack)) return 'Fair Trade';

  // (e) fallback
  return fallback;
}

export default function VerdictScreen({
  route,
}: RootStackScreenProps<'Verdict'>) {
  const { verdict } = route.params;
  const confidencePercent = Math.round(
    Math.max(0, Math.min(1, verdict.confidence)) * 100,
  );

  const cleanedOriginals = verdict.evidence_points
    .map((p) => p.trim())
    .filter(isCleanEnglishChip);

  const haystack = [verdict.reasoning, ...verdict.evidence_points].join(' ');
  const mentionsNumber = numberLike.test(haystack);
  const mentionsCertPositive =
    certPositiveRe.test(haystack) && !certNegationRe.test(haystack);

  const derivedClaim = deriveAssessedClaim(verdict, de.verdict.claimNeutral);

  let displayChips: string[];
  if (verdict.verdict === 'Verifiable') {
    const derived: string[] = [];
    if (mentionsNumber) derived.push(de.verdict.chipNumberDetected);
    derived.push(de.verdict.chipMeasurable);
    if (!mentionsCertPositive) derived.push(de.verdict.noCertChip);
    const seen = new Set(derived.map((s) => s.toLowerCase()));
    const extras = cleanedOriginals.filter((p) => !seen.has(p.toLowerCase()));
    displayChips = [...derived, ...extras].slice(0, 3);
  } else {
    displayChips = cleanedOriginals.slice(0, 3);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.brandMeta}>{de.verdict.brandMeta}</Text>
        <VerdictBadge verdict={verdict.verdict} />

        <View style={styles.section}>
          <Text style={styles.label}>{de.verdict.claimLabel}</Text>
          <Text style={styles.claim}>{derivedClaim}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{de.verdict.confidenceLabel}</Text>
          <View style={styles.confidenceRow}>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  {
                    width: `${confidencePercent}%`,
                    backgroundColor: confidenceColor[verdict.verdict],
                  },
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

        {displayChips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>{de.verdict.evidenceLabel}</Text>
            <View style={styles.chipsBlock}>
              {displayChips.map((point, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.disclaimer}>{de.verdict.disclaimer}</Text>

        <View style={styles.divider} />

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
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 24,
    gap: 20,
  },
  brandMeta: {
    fontFamily: fonts.body,
    color: palette.creamDim,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
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
  claim: {
    fontFamily: fonts.body,
    color: palette.cream,
    fontSize: 15,
    lineHeight: 22,
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
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipText: {
    fontFamily: fonts.body,
    color: palette.cream,
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    color: 'rgba(241,236,222,0.4)',
    fontSize: 10,
  },
});
