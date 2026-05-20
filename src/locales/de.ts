export const de = {
  app: {
    name: 'GreenReceipt',
  },
  home: {
    heading: 'Nachhaltigkeitsaussage prüfen',
    subheading: 'Verpackung fotografieren, Aussage klassifizieren.',
    scanButton: 'Foto aufnehmen',
    permissionTitle: 'Kamerazugriff erforderlich',
    permissionMessage:
      'Diese App benötigt Zugriff auf die Kamera, um Verpackungsaussagen zu erfassen.',
    permissionGrant: 'Zugriff erlauben',
    scanning: 'Text wird erkannt …',
    ocrEmpty: 'Kein Text erkannt. Bitte erneut versuchen.',
    ocrError: 'Texterkennung fehlgeschlagen. Bitte erneut versuchen.',
  },
  review: {
    heading: 'Aussage überprüfen',
    instruction: 'Den erkannten Text bei Bedarf anpassen.',
    placeholder: 'Aussage eingeben …',
    classifyButton: 'Klassifizieren',
    classifying: 'Wird klassifiziert …',
    error: {
      title: 'Fehler',
      retry: 'Erneut versuchen',
      close: 'Schließen',
      network: 'Netzwerkfehler. Bitte erneut versuchen.',
      parse: 'Ungültige Antwort vom Server.',
      rateLimited: 'Tageslimit erreicht. Versuche es morgen.',
      codes: {
        invalidInput: 'Eingabe zu kurz oder ungültig.',
        invalidDeviceId: 'Gerätekennung ungültig. App neu starten.',
        serverNotConfigured:
          'Server nicht konfiguriert. Bitte später erneut versuchen.',
        classificationFailed:
          'Klassifizierung fehlgeschlagen. Bitte erneut versuchen.',
        unknown: 'Unbekannter Fehler.',
      },
    },
  },
  verdict: {
    heading: 'Result',
    confidenceLabel: 'Confidence',
    reasoningLabel: 'Why this verdict',
    evidenceLabel: 'Evidence found',
    modelLabel: 'Model',
    tokensLabel: 'tokens',
    disclaimer:
      'Educational assessment of claim quality. Not a legal judgment.',
    brandMeta: 'EVIDENCE CARD · GREENRECEIPT',
    claimLabel: 'Assessed claim',
    claimNeutral: 'Sustainability claim detected',
    noCertChip: 'No certification cited',
    chipNumberDetected: 'Specific percentage detected',
    chipMeasurable: 'Claim is measurable',
  },
} as const;

export type Locale = typeof de;
