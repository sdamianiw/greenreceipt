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

export const ClassifyErrorEnvelopeSchema = z.discriminatedUnion('error', [
  z.object({ error: z.literal('rate_limit_exceeded') }),
  z.object({ error: z.literal('invalid_input') }),
  z.object({ error: z.literal('invalid_ocr_text') }),
  z.object({ error: z.literal('invalid_device_id') }),
  z.object({ error: z.literal('invalid_json') }),
  z.object({ error: z.literal('method_not_allowed') }),
  z.object({ error: z.literal('server_not_configured') }),
  z.object({
    error: z.literal('classification_failed'),
    error_code: z.string(),
  }),
]);

export type ClassifyErrorEnvelope = z.infer<typeof ClassifyErrorEnvelopeSchema>;

export class ClassifyError extends Error {
  constructor(
    public envelope: ClassifyErrorEnvelope,
    public httpStatus: number,
  ) {
    super(envelope.error);
    this.name = 'ClassifyError';
  }
}
