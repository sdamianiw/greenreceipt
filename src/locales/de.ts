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
  },
  verdict: {
    heading: 'Ergebnis',
    confidenceLabel: 'Konfidenz',
    reasoningLabel: 'Begründung',
    evidenceLabel: 'Anhaltspunkte',
    modelLabel: 'Modell',
    tokensLabel: 'Tokens',
  },
} as const;

export type Locale = typeof de;
