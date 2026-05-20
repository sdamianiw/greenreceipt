// @ts-nocheck - Deno Edge Function runtime; not type-checked by node tsc.
// Phase 01 Core Loop · T3.2 · GreenReceipt V1.0
// Single-file: no project imports. Raw fetch to OpenAI Responses + Supabase REST.

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DAILY_SCAN_LIMIT = 20;

const SYSTEM_PROMPT = `You are a sober classifier of sustainability claims printed on product packaging.

Task: Assign the claim text to exactly one of four categories:
- "Vague": Very general, with no verifiable reference.
- "Verifiable": Concrete and in principle verifiable, but with no evidence shown in the text.
- "Unsupported": Concrete, but lacking the kind of standard or external reference that would normally be expected.
- "Substantiated": Concrete, with a reference to a standard, testing body, certificate, or study.

Strict rules:
1. Factual, descriptive language. No moral judgments.
2. No accusations, no legal assessments, no final verdicts about specific companies or brands. Never use words like greenwashing, illegal, fraud, lie, lying, guilty, deception, Betrug, Lüge, schuldig, Verbrauchertäuschung.
3. No claims about misconduct, crimes, or commercial dishonesty.
4. Describe only what the text says and what is missing. Do not speculate about intent.
5. When uncertain, downgrade conservatively (e.g., "Verifiable" instead of "Substantiated").
6. Absolute or sweeping environmental claims (e.g., "100% sustainable", "climate neutral", "carbon neutral", "fully recyclable", "biodegradable", "zero impact", "plastic-free") are "Unsupported" when no methodology, scope, or third-party standard is cited. "Verifiable" applies only to bounded measurable claims (e.g., "50% recycled plastic", "30% CO2 reduction vs 2020") that are concrete and checkable but lack a certification mark in the text.
7. Write reasoning and evidence_points in English, regardless of the input language. Reasoning max 200 characters. Up to 3 evidence_points, each max 80 characters.
8. Set language_detected to reflect the input text language: "de", "en", "es", or "other".

Response: JSON with fields verdict, confidence, reasoning, evidence_points, language_detected.`;

const FEWSHOTS = [
  { role: "user", content: "umweltfreundlich" },
  { role: "assistant", content: "{\"verdict\":\"Vague\",\"confidence\":0.9,\"reasoning\":\"Very general term with no concrete verifiable content.\",\"evidence_points\":[\"no standard cited\",\"no quantitative claim\"],\"language_detected\":\"de\"}" },
  { role: "user", content: "klimaneutral" },
  { role: "assistant", content: "{\"verdict\":\"Vague\",\"confidence\":0.85,\"reasoning\":\"Term used without accounting methodology or standard reference in the text.\",\"evidence_points\":[\"no methodology stated\",\"no standard cited\"],\"language_detected\":\"de\"}" },
  { role: "user", content: "70% recyceltes Plastik" },
  { role: "assistant", content: "{\"verdict\":\"Verifiable\",\"confidence\":0.8,\"reasoning\":\"Concrete percentage, in principle verifiable, but no evidence shown in the text.\",\"evidence_points\":[\"concrete figure 70%\",\"no certification mark shown\"],\"language_detected\":\"de\"}" },
  { role: "user", content: "100% biologisch abbaubar" },
  { role: "assistant", content: "{\"verdict\":\"Unsupported\",\"confidence\":0.75,\"reasoning\":\"Absolute claim without methodology or standard (e.g., EN 13432) cited.\",\"evidence_points\":[\"absolute 100% claim\",\"no standard cited\"],\"language_detected\":\"de\"}" },
  { role: "user", content: "Carbon neutral product" },
  { role: "assistant", content: "{\"verdict\":\"Unsupported\",\"confidence\":0.75,\"reasoning\":\"Sweeping neutrality claim with no methodology, scope, or third-party standard cited.\",\"evidence_points\":[\"absolute neutrality claim\",\"no methodology stated\",\"no standard cited\"],\"language_detected\":\"en\"}" },
  { role: "user", content: "CO2-neutral gemäß eigenem Standard" },
  { role: "assistant", content: "{\"verdict\":\"Unsupported\",\"confidence\":0.7,\"reasoning\":\"Concrete, but 'own standard' is not a recognized external reference.\",\"evidence_points\":[\"internal standard only\",\"no external testing body\"],\"language_detected\":\"de\"}" },
  { role: "user", content: "natürlich und gesund" },
  { role: "assistant", content: "{\"verdict\":\"Unsupported\",\"confidence\":0.65,\"reasoning\":\"Health-related claim without the required reference to a study.\",\"evidence_points\":[\"health claim\",\"no study cited\"],\"language_detected\":\"de\"}" },
  { role: "user", content: "FSC-zertifiziertes Papier, Lizenz FSC-C123456" },
  { role: "assistant", content: "{\"verdict\":\"Substantiated\",\"confidence\":0.95,\"reasoning\":\"Concrete certification with a verifiable license number.\",\"evidence_points\":[\"FSC certification\",\"license FSC-C123456\"],\"language_detected\":\"de\"}" },
  { role: "user", content: "Kompostierbar nach EN 13432, geprüft durch DIN CERTCO" },
  { role: "assistant", content: "{\"verdict\":\"Substantiated\",\"confidence\":0.95,\"reasoning\":\"Standard cited and a concrete testing body named.\",\"evidence_points\":[\"EN 13432\",\"DIN CERTCO\"],\"language_detected\":\"de\"}" },
];

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["Vague", "Verifiable", "Unsupported", "Substantiated"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reasoning: { type: "string", maxLength: 200 },
    evidence_points: { type: "array", items: { type: "string", maxLength: 80 }, maxItems: 3 },
    language_detected: { type: "string", enum: ["de", "en", "es", "other"] },
  },
  required: ["verdict", "confidence", "reasoning", "evidence_points", "language_detected"],
  additionalProperties: false,
};

function json(body: unknown, status: number): Response {
  if (status >= 400) {
    console.error(JSON.stringify({ status, body }));
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });
}

// Wrapped error envelope: { error: "classification_failed", error_code: "<machine_code>" }.
// Use for ALL unexpected internal failures (Supabase/OpenAI/model output).
// Do NOT use for validation errors or rate limit — those keep direct error shape.
function classificationFailed(error_code: string, status = 500): Response {
  return json({ error: "classification_failed", error_code }, status);
}

function safeErrorCode(prefix: string, status: number | string, body: unknown): string {
  const snippet = String(body ?? "").replace(/[^A-Za-z0-9]/g, "_").slice(0, 48);
  return `${prefix}_${status}_${snippet}`;
}

const VERDICT_VALUES = ["Vague", "Verifiable", "Unsupported", "Substantiated"];
const LANG_VALUES = ["de", "en", "es", "other"];

function validateVerdict(v: any): v is {
  verdict: string;
  confidence: number;
  reasoning: string;
  evidence_points: string[];
  language_detected: string;
} {
  if (!v || typeof v !== "object") return false;
  if (typeof v.verdict !== "string" || !VERDICT_VALUES.includes(v.verdict)) return false;
  if (typeof v.confidence !== "number" || !Number.isFinite(v.confidence)) return false;
  if (v.confidence < 0 || v.confidence > 1) return false;
  if (typeof v.reasoning !== "string" || v.reasoning.length > 200) return false;
  if (!Array.isArray(v.evidence_points) || v.evidence_points.length > 3) return false;
  for (const ep of v.evidence_points) {
    if (typeof ep !== "string" || ep.length > 80) return false;
  }
  if (typeof v.language_detected !== "string" || !LANG_VALUES.includes(v.language_detected)) return false;
  return true;
}

function extractOutputText(resp: any): string {
  if (typeof resp?.output_text === "string" && resp.output_text.length > 0) {
    return resp.output_text;
  }
  if (Array.isArray(resp?.output)) {
    for (const item of resp.output) {
      if (item?.type === "message" && Array.isArray(item?.content)) {
        for (const c of item.content) {
          if ((c?.type === "output_text" || c?.type === "text") && typeof c?.text === "string") {
            return c.text;
          }
        }
      }
    }
  }
  return "";
}

function outputTypes(resp: any): string {
  if (!Array.isArray(resp?.output) || resp.output.length === 0) return "empty";
  return resp.output.map((o: any) => o?.type ?? "unknown").join("-");
}

async function insertScanMetadata(
  supabaseUrl: string,
  serviceRoleKey: string,
  row: { device_id: string; verdict: string; confidence: number; model_used: string; tokens_used: number },
): Promise<Response> {
  return await fetch(`${supabaseUrl}/rest/v1/scans`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(5_000),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-5-nano";

  if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "server_not_configured" }, 500);
  }

  let body: { ocr_text?: unknown; device_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const device_id = body?.device_id;
  const ocrText = body?.ocr_text;

  if (typeof device_id !== "string" || !UUID_V4.test(device_id)) {
    return json({ error: "invalid_device_id" }, 400);
  }
  if (typeof ocrText !== "string" || ocrText.length < 3 || ocrText.length > 4000) {
    return json({ error: "invalid_input" }, 400);
  }

  // Rate limit pre-check: GET /rest/v1/scans with limit=DAILY_SCAN_LIMIT (no HEAD count).
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const rateUrl =
    `${SUPABASE_URL}/rest/v1/scans?select=id&device_id=eq.${device_id}` +
    `&created_at=gte.${encodeURIComponent(since)}&limit=${DAILY_SCAN_LIMIT}`;

  let rateResp: Response;
  try {
    rateResp = await fetch(rateUrl, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      signal: AbortSignal.timeout(5_000),
    });
  } catch (err) {
    const isTimeout = err?.name === "TimeoutError";
    return classificationFailed(
      isTimeout ? "scan_count_timeout" : "scan_count_network_error",
      isTimeout ? 504 : 502,
    );
  }

  if (!rateResp.ok) {
    const t = await rateResp.text().catch(() => "");
    return classificationFailed(safeErrorCode("scan_count_failed", rateResp.status, t), 500);
  }

  let rows: unknown;
  try {
    rows = await rateResp.json();
  } catch {
    return classificationFailed(safeErrorCode("scan_count_failed", rateResp.status, "parse"), 500);
  }
  if (Array.isArray(rows) && rows.length >= DAILY_SCAN_LIMIT) {
    return json({ error: "rate_limit_exceeded" }, 429);
  }

  // OpenAI Responses API (raw fetch — Deno runtime / gpt-5-nano lock).
  let oaResp: Response;
  try {
    oaResp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          ...FEWSHOTS,
          { role: "user", content: ocrText },
        ],
        reasoning: { effort: "low" },
        max_output_tokens: 1200,
        text: {
          format: {
            type: "json_schema",
            name: "VerdictResponse",
            schema: VERDICT_SCHEMA,
            strict: true,
          },
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    const isTimeout = err?.name === "TimeoutError";
    return classificationFailed(
      isTimeout ? "openai_timeout" : "openai_network_error",
      isTimeout ? 504 : 502,
    );
  }

  if (!oaResp.ok) {
    const t = await oaResp.text().catch(() => "");
    return classificationFailed(safeErrorCode("openai_response_failed", oaResp.status, t), 502);
  }

  let oaJson: any;
  try {
    oaJson = await oaResp.json();
  } catch {
    return classificationFailed(safeErrorCode("openai_response_failed", oaResp.status, "parse"), 502);
  }

  const outputText = extractOutputText(oaJson);
  if (!outputText) {
    const status = oaJson?.status ?? "unknown";
    const reason = oaJson?.incomplete_details?.reason ?? "no_reason";
    const types = outputTypes(oaJson);
    return classificationFailed(`empty_model_output_${status}_${reason}_${types}`, 502);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    return classificationFailed("model_output_invalid_json", 502);
  }

  if (!validateVerdict(parsed)) {
    return classificationFailed("invalid_model_json", 502);
  }

  const tokensUsed: number = oaJson?.usage?.total_tokens ?? 0;

  let insResp: Response;
  try {
    insResp = await insertScanMetadata(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      device_id,
      verdict: parsed.verdict,
      confidence: parsed.confidence,
      model_used: MODEL,
      tokens_used: tokensUsed,
    });
  } catch (err) {
    const isTimeout = err?.name === "TimeoutError";
    return classificationFailed(
      isTimeout ? "scan_insert_timeout" : "scan_insert_network_error",
      isTimeout ? 504 : 502,
    );
  }

  if (!insResp.ok) {
    const t = await insResp.text().catch(() => "");
    return classificationFailed(safeErrorCode("scan_insert_failed", insResp.status, t), 500);
  }

  return json(
    {
      verdict: parsed.verdict,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      evidence_points: parsed.evidence_points,
      language_detected: parsed.language_detected,
      model_used: MODEL,
      tokens_used: tokensUsed,
    },
    200,
  );
});
