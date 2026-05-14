import { VerdictResponseSchema, type VerdictResponse } from '../types/verdict';
import { supabase } from './supabase';

const MOCK_RESPONSE: VerdictResponse = {
  verdict: 'Verifiable',
  confidence: 0.82,
  reasoning: 'Mock-Klassifizierung für Entwicklung ohne Backend.',
  evidence_points: ['Mock-Anhaltspunkt 1', 'Mock-Anhaltspunkt 2'],
  language_detected: 'de',
  model_used: 'mock',
  tokens_used: 0,
};

export async function classify(
  ocrText: string,
  deviceId: string,
): Promise<VerdictResponse> {
  if (process.env.EXPO_PUBLIC_CLASSIFY_MOCK === '1') {
    await new Promise((r) => setTimeout(r, 600));
    return VerdictResponseSchema.parse(MOCK_RESPONSE);
  }
  const { data, error } = await supabase.functions.invoke('classify', {
    body: { ocr_text: ocrText, device_id: deviceId },
  });
  if (error) throw error;
  return VerdictResponseSchema.parse(data);
}
