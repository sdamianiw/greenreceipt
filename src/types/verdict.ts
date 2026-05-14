import { z } from 'zod';

export const VerdictEnum = z.enum([
  'Vague',
  'Verifiable',
  'Unsupported',
  'Substantiated',
]);

export const VerdictResponseSchema = z.object({
  verdict: VerdictEnum,
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(200),
  evidence_points: z.array(z.string().max(80)).max(3),
  language_detected: z.enum(['de', 'en', 'es', 'other']),
  model_used: z.string(),
  tokens_used: z.number().int(),
});

export type Verdict = z.infer<typeof VerdictEnum>;
export type VerdictResponse = z.infer<typeof VerdictResponseSchema>;
