import { FunctionsHttpError } from '@supabase/supabase-js';
import {
  ClassifyError,
  ClassifyErrorEnvelopeSchema,
  VerdictResponseSchema,
  type VerdictResponse,
} from '../types/verdict';
import { supabase } from './supabase';

function hasStringError(x: unknown): x is { error: string } {
  return (
    typeof x === 'object' &&
    x !== null &&
    'error' in x &&
    typeof (x as { error: unknown }).error === 'string'
  );
}

export async function classify(
  ocrText: string,
  deviceId: string,
): Promise<VerdictResponse> {
  const { data, error } = await supabase.functions.invoke('classify', {
    body: { ocr_text: ocrText, device_id: deviceId },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const status = error.context.status;
      const raw: unknown = await error.context.json().catch(() => null);

      const strict = ClassifyErrorEnvelopeSchema.safeParse(raw);
      if (strict.success) {
        throw new ClassifyError(strict.data, status);
      }

      if (hasStringError(raw)) {
        throw new ClassifyError(
          { error: 'classification_failed', error_code: raw.error },
          status,
        );
      }

      throw new ClassifyError(
        { error: 'classification_failed', error_code: `non_json_${status}` },
        status,
      );
    }

    throw new ClassifyError(
      { error: 'classification_failed', error_code: 'network_or_unknown' },
      0,
    );
  }

  const parsed = VerdictResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new ClassifyError(
      { error: 'classification_failed', error_code: 'invalid_model_json' },
      200,
    );
  }
  return parsed.data;
}
