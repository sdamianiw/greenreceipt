# PROMPT CONTRACT — GreenReceipt V1.0 · Phase 01 Core Loop
# Version: 2.1 (B3 REQ-IDs + B4 fewshot fix applied)
# Date: 2026-05-14

## ROL
Senior React Native engineer ejecutando SDD methodology con HARD RULES de Sebas.
Plan mode default. Audit Level 2 post-task. Sin laziness, root causes only.
"Puedes delegar tu pensamiento pero no puedes delegar tu comprensión" — valida
tu propia comprensión antes de aprobar cada step.

## GOAL (quantifiable)
Ship Phase 01 Core Loop de GreenReceipt V1.0 en <=5h de Claude Code time.
Demo verificable: ejecutar `npm start`, abrir Expo Go en device, snap photo
de eco-product packaging real, ver verdict JSON 
{Vague|Verifiable|Unsupported|Substantiated} returned from Supabase Edge 
Function backed by OpenAI gpt-5-nano (primary) o gpt-4.1-nano (fallback).

## REQUIREMENTS (canonical, REQ-IDs locked)

### Functional (REQ-F)
- REQ-F-01: Camera capture → on-device OCR (ML Kit) → editable text in ReviewScreen.
- REQ-F-02: Anonymous device_id (UUID v4) generated client-side via expo-crypto, persisted in expo-secure-store, lazy init.
- REQ-F-03: POST {device_id, claim_text} to Supabase Edge Function `/classify`.
- REQ-F-04: Verdict response = strict JSON schema (VerdictResponseSchema), validated client-side via Zod before render.
- REQ-F-05: VerdictScreen renders verdict + confidence + reasoning + up to 3 evidence_points + model_used + tokens_used.
- REQ-F-06: Phase 02/03 screens (Share, History, Settings) exist as stubs returning null.

### Non-functional (REQ-NF)
- REQ-NF-01: P95 end-to-end latency <=8s on real device with 4G connection.
- REQ-NF-02: Server-side rate limit 3 scans/device_id/UTC day; 4th attempt returns HTTP 429.
- REQ-NF-03: Phase 01 dev time hard cap 5h; per-task soft cap 1.5h with STOP+replan trigger.
- REQ-NF-04: UI 100% German formal impersonal; all strings sourced from `src/locales/de.ts`; zero English fallback visible.
- REQ-NF-05: Visual palette ChemTrace dark editorial locked (bg #0E131C, rust #E87B4D, blue #67B8F0, cream #F1ECDE).

### Security + Privacy (REQ-S)
- REQ-S-01: OPENAI_API_KEY only in Supabase Edge Function env var; grep `OPENAI_API_KEY|sk-` in `src/` returns 0 matches.
- REQ-S-02: OCR on-device only; no image upload to backend or third-party; no `image_url` in OpenAI payload.
- REQ-S-03: `claim_text` NOT persisted in `scans` table (privacy); only verdict + telemetry stored. Submissions table is Phase 03.
- REQ-S-04: Forbidden wording filter applies to UI, system prompt, fewshots, logs, errors (list: greenwashing, illegal, illegale, Betrug, fraud, Lüge, Lügen, schuldig, guilty, "false advertising", "irreführende Werbung", "this company lies", "diese Firma lügt", Verbrauchertäuschung).
- REQ-S-05: device_id validated server-side as UUID v4 format before any DB write or OpenAI call.

### Architecture (REQ-A)
- REQ-A-01: Stack whitelist 14 deps locked (see CONSTRAINTS); no additions without audited approval.
- REQ-A-02: 6 screens total V1.0; navigator stack rejects 7th.
- REQ-A-03: Model primary `gpt-5-nano`, fallback `gpt-4.1-nano` via `OPENAI_MODEL` Supabase secret; default if unset = `gpt-5-nano`.
- REQ-A-04: LLM params locked: temperature=0.2, max_tokens=300, response_format=json_schema strict.
- REQ-A-05: System prompt + fewshots in separate files (`src/prompts/system_de.ts`, `src/prompts/fewshots_de.json`), mirrored into `supabase/functions/classify/`.
- REQ-A-06: Anonymous flow only; no login screen, no Supabase auth; anon API key client-side.

### Traceability
Every CONSTRAINTS bullet and FAILURE condition below maps back to one or more REQ-IDs. If a CC implementation step cannot trace to a REQ-ID, it is scope creep and must be rejected.

## CONSTRAINTS (hard)

### Stack EXACTO (whitelist)
- Expo SDK latest + TypeScript strict
- @supabase/supabase-js (client)
- @react-native-ml-kit/text-recognition (on-device OCR)
- expo-camera
- expo-secure-store (device_id only)
- expo-crypto (UUID v4 native generation)
- expo-dev-client (ML Kit autolinking)
- @react-navigation/native + @react-navigation/native-stack
- react-native-screens + react-native-safe-area-context (nav peer deps)
- zod (schema validation client+server)
- @expo-google-fonts/fraunces + @expo-google-fonts/ibm-plex-sans
- @expo-google-fonts/ibm-plex-mono

NO añadir libs fuera de esta lista sin justificación auditada y aprobada
por Sebas. AsyncStorage, react-native-mmkv, native auth libs PROHIBIDOS V1.0.

### Visual palette LOCKED (ChemTrace dark editorial)
- Background: #0E131C
- Rust accent: #E87B4D
- Blue accent: #67B8F0
- Cream text: #F1ECDE
- Terminal bg (code blocks): #080C13
- Fonts: Fraunces (display headers), IBM Plex Sans (body), IBM Plex Mono (technical)
- Dark theme ONLY. NO light mode switch.

### Linguistic + content rules
- UI 100% alemán. ALL strings en `src/locales/de.ts`. ZERO English fallback visible.
- Formal impersonal German (no Sie/du switch logic V1.0).
- Forbidden wording in ANY output (UI, prompts, logs, errors):
  greenwashing, Greenwashing, illegal, illegale, Betrug, fraud, Lüge, Lügen,
  schuldig, guilty, "false advertising", "irreführende Werbung",
  "this company lies", "diese Firma lügt", Verbrauchertäuschung.

### Architecture invariants
- OCR ON-DEVICE only. NO Google Cloud Vision. NO image upload anywhere.
- OPENAI_API_KEY NEVER client-side. ONLY in Supabase Edge Function env var.
- Rate limit enforced SERVER-SIDE: 3 scans/device_id/día. 4th → HTTP 429.
- JSON schema response enforced via `response_format: json_schema` (strict).
- device_id = UUID v4 generado client-side primera vez, persistido en
  expo-secure-store (NO AsyncStorage para device_id).
- Anonymous flow: NO login screen, NO Supabase auth. SOLO anon API key.
- 6 screens lock total V1.0 (Home, Review, Verdict, Share, History, Settings).
- NO logging de claim_text en tabla `scans` (privacy). Sólo en `submissions`
  table (Phase 03), si user submitea explícitamente.

### LLM Inference rules
- Model PRIMARY: `gpt-5-nano` (cheapest, classification-suitable per OpenAI).
- Model FALLBACK: `gpt-4.1-nano` (proven stability).
- Selection via env var: `OPENAI_MODEL` in Supabase secrets.
  Default if unset: `gpt-5-nano`.
- temperature: 0.2 (low variance, classification consistency).
- max_tokens: 300 (cost cap, prevents output runaway).
- response_format: strict json_schema (see src/types/verdict.ts).
- CONSERVATIVE BIAS in prompt: if uncertain → downgrade verdict.
- System prompt LOCKED in `src/prompts/system_de.ts` (NOT inline in Edge Function).
- Few-shots LOCKED in `src/prompts/fewshots_de.json` (8 examples, 2 per category).
- NO web search tool, NO function calling, NO image input V1.0.

## FORMAT (exact output shape)

### Repo structure (post-Phase 01)
```
greenreceipt/
├── app.json
├── package.json
├── tsconfig.json (strict: true)
├── App.tsx                          (NavigationContainer + Stack)
├── CLAUDE.md                        (rules for CC, 30 lines max)
├── .specs/
│   └── phases/
│       └── 01-core-loop/
│           ├── PROMPT_CONTRACT.md   (this file)
│           ├── CONTEXT.md           (technical decisions log)
│           ├── PLAN-01.md           (3 tasks)
│           └── VERIFY.md            (DoD checklist)
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx           (Camera + scan button)
│   │   ├── ReviewScreen.tsx         (OCR text edit)
│   │   ├── VerdictScreen.tsx        (Verdict JSON display)
│   │   ├── ShareScreen.tsx          (Phase 02 stub: returns null)
│   │   ├── HistoryScreen.tsx        (Phase 02 stub: returns null)
│   │   └── SettingsScreen.tsx       (Phase 03 stub: returns null)
│   ├── components/
│   │   └── VerdictBadge.tsx         (color-coded badge, Phase 02 expands)
│   ├── services/
│   │   ├── supabase.ts              (client init from env)
│   │   ├── classify.ts              (POST /classify wrapper)
│   │   └── deviceId.ts              (secure-store UUID v4 lazy init)
│   ├── prompts/
│   │   ├── system_de.ts             (system prompt export const)
│   │   └── fewshots_de.json         (8 message pairs)
│   ├── locales/
│   │   └── de.ts                    (ALL UI strings)
│   ├── theme/
│   │   └── chemtrace.ts             (palette + font config)
│   └── types/
│       └── verdict.ts               (Zod schema + TS type)
└── supabase/
    └── functions/
        └── classify/
            ├── index.ts             (Deno Edge Function)
            ├── system_prompt.ts     (re-exported / mirrored)
            └── fewshots.json        (re-exported / mirrored)
```

### Verdict JSON shape (canonical, Zod-validated)
```typescript
// src/types/verdict.ts
import { z } from 'zod';

export const VerdictEnum = z.enum([
  'Vague', 'Verifiable', 'Unsupported', 'Substantiated'
]);

export const VerdictResponseSchema = z.object({
  verdict: VerdictEnum,
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(200),
  evidence_points: z.array(z.string().max(80)).max(3),
  language_detected: z.enum(['de', 'en', 'es', 'other']),
  model_used: z.string(),        // injected by Edge Function from env
  tokens_used: z.number().int()  // injected by Edge Function
});

export type VerdictResponse = z.infer<typeof VerdictResponseSchema>;
```

### System prompt (paste verbatim into src/prompts/system_de.ts)
```typescript
export const SYSTEM_PROMPT_DE = `You are GreenReceipt's claim classifier. Your only job: classify ONE sustainability claim into ONE of four categories, returning strict JSON.

CATEGORIES (apply in order; first match wins):

VAGUE: no measurable metric AND no defined scope.
  Examples: "umweltfreundlich", "natürlich", "grün", "eco-friendly".

VERIFIABLE: measurable metric AND defined scope BUT no source/standard cited.
  Examples: "reduziert CO₂ um 30% gegenüber 2020", "50% Recyclingmaterial".

UNSUPPORTED: specific assertion BUT scope unclear OR no third-party evidence.
  Examples: "100% nachhaltig", "klimaneutral", "vollständig recycelbar".

SUBSTANTIATED: measurable metric AND recognized third-party standard cited.
  Recognized: ISO 14021/14024/14025, EU Ecolabel, Blauer Engel, TÜV, B Corp,
  ClimatePartner, Cradle to Cradle, GOTS, FSC, PEFC, Fairtrade, Bio-Siegel.

CONSERVATIVE BIAS (HARD): when uncertain between two categories, ALWAYS choose
LESS favorable to brand. Order: UNSUPPORTED < VAGUE < VERIFIABLE < SUBSTANTIATED.
Tie → downgrade. Doubt → downgrade.

EDGE CASES:
- Empty/garbled OCR: verdict="Vague", confidence≤0.3,
  reasoning="Keine erkennbare Nachhaltigkeitsaussage."
- Multiple claims: classify STRONGEST only.
- Brand name + claim: ignore brand, classify claim text only.

OUTPUT LANGUAGE:
- Reason internally in English.
- ALL output text fields ("reasoning", "evidence_points") in formal German.
- Max 200 chars reasoning, max 80 chars per evidence point, max 3 points.

FORBIDDEN WORDING (never output): greenwashing, illegal, Betrug, fraud, Lüge,
schuldig, "false advertising", "irreführende Werbung", Verbrauchertäuschung.

FORMAT: Strict JSON matching provided schema. No prose. No markdown.`;
```

### Few-shots (8 examples — paste into src/prompts/fewshots_de.json)
```json
[
  {"role":"user","content":"Claim: \"Umweltfreundliches Produkt\""},
  {"role":"assistant","content":"{\"verdict\":\"Vague\",\"confidence\":0.92,\"reasoning\":\"Allgemeine Aussage ohne messbare Kennzahl, Zeitraum oder definierten Geltungsbereich.\",\"evidence_points\":[\"Keine quantitative Angabe\",\"Kein definierter Anwendungsbereich\",\"Kein Standard erwähnt\"],\"language_detected\":\"de\"}"},
  {"role":"user","content":"Claim: \"100% natürliche Inhaltsstoffe\""},
  {"role":"assistant","content":"{\"verdict\":\"Unsupported\",\"confidence\":0.82,\"reasoning\":\"Spezifische Quote (100%) bezogen auf rechtlich undefinierten Begriff 'natürlich', ohne Drittprüfung oder Inhaltsstoff-Audit.\",\"evidence_points\":[\"'Natürlich' ohne rechtliche Definition\",\"100% Anspruch ohne Audit-Beleg\",\"Keine Zertifizierung referenziert\"],\"language_detected\":\"de\"}"},
  {"role":"user","content":"Claim: \"Reduziert CO₂-Emissionen um 30% gegenüber 2020\""},
  {"role":"assistant","content":"{\"verdict\":\"Verifiable\",\"confidence\":0.85,\"reasoning\":\"Messbare Kennzahl mit Basisjahr, aber keine Drittprüfung oder Methodik genannt.\",\"evidence_points\":[\"Quantitative Angabe: 30%\",\"Basisjahr 2020 referenziert\",\"Keine Zertifizierung oder Audit genannt\"],\"language_detected\":\"de\"}"},
  {"role":"user","content":"Claim: \"Verpackung zu 50% aus Recyclingmaterial\""},
  {"role":"assistant","content":"{\"verdict\":\"Verifiable\",\"confidence\":0.80,\"reasoning\":\"Konkrete Quote mit klarem Geltungsbereich Verpackung, jedoch ohne unabhängige Zertifizierung.\",\"evidence_points\":[\"Anteil 50% spezifiziert\",\"Geltungsbereich Verpackung klar\",\"Kein Recycling-Standard genannt\"],\"language_detected\":\"de\"}"},
  {"role":"user","content":"Claim: \"Vollständig nachhaltige Lieferkette\""},
  {"role":"assistant","content":"{\"verdict\":\"Unsupported\",\"confidence\":0.88,\"reasoning\":\"Absolutaussage über komplexes System ohne Zertifizierung, Methodik oder Berichterstattung.\",\"evidence_points\":[\"Superlativ 'vollständig' ohne Beleg\",\"Lieferkette komplex und schwer prüfbar\",\"Keine Transparenz-Quelle genannt\"],\"language_detected\":\"de\"}"},
  {"role":"user","content":"Claim: \"Klimaneutrales Produkt seit 2022\""},
  {"role":"assistant","content":"{\"verdict\":\"Unsupported\",\"confidence\":0.82,\"reasoning\":\"Klimaneutralitätsaussage ohne Angabe des Standards, Kompensationsmechanismus oder unabhängiger Prüfstelle.\",\"evidence_points\":[\"Kein Kompensations-Standard genannt\",\"Keine Prüfstelle referenziert\",\"Bilanzierungsmethodik unklar\"],\"language_detected\":\"de\"}"},
  {"role":"user","content":"Claim: \"Zertifiziert klimaneutral durch ClimatePartner seit 2023, Projekt-ID: 13452\""},
  {"role":"assistant","content":"{\"verdict\":\"Substantiated\",\"confidence\":0.91,\"reasoning\":\"Drittanbieter-Zertifizierung mit überprüfbarer Projekt-ID und Zeitraum.\",\"evidence_points\":[\"ClimatePartner als anerkannte Prüfstelle\",\"Projekt-ID 13452 öffentlich überprüfbar\",\"Zeitraum seit 2023 spezifiziert\"],\"language_detected\":\"de\"}"},
  {"role":"user","content":"Claim: \"EU Ecolabel zertifiziert (DE/021/0001), Recyclinganteil 47% gemäß ISO 14021\""},
  {"role":"assistant","content":"{\"verdict\":\"Substantiated\",\"confidence\":0.94,\"reasoning\":\"Zwei anerkannte Standards mit Lizenznummer und Methodikverweis, unabhängig überprüfbar.\",\"evidence_points\":[\"EU Ecolabel Lizenz DE/021/0001\",\"ISO 14021 als Methodik referenziert\",\"Quantitative Angabe 47% nachvollziehbar\"],\"language_detected\":\"de\"}"}
]
```

### Edge Function template (supabase/functions/classify/index.ts)
```typescript
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OpenAI } from "https://deno.land/x/openai@v4.x/mod.ts";
import { SYSTEM_PROMPT_DE } from "./system_prompt.ts";
import fewshots from "./fewshots.json" with { type: "json" };

const VERDICT_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "claim_verdict",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        verdict: { type: "string", enum: ["Vague","Verifiable","Unsupported","Substantiated"] },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        reasoning: { type: "string", maxLength: 200 },
        evidence_points: { type: "array", items: { type: "string", maxLength: 80 }, maxItems: 3 },
        language_detected: { type: "string", enum: ["de","en","es","other"] }
      },
      required: ["verdict","confidence","reasoning","evidence_points","language_detected"]
    }
  }
};

serve(async (req) => {
  const { device_id, claim_text } = await req.json();
  
  // Validate device_id UUID v4 format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(device_id)) {
    return new Response(JSON.stringify({ error: "Invalid device_id" }), { status: 400 });
  }
  
  // Validate claim_text
  if (!claim_text || claim_text.length > 1000) {
    return new Response(JSON.stringify({ error: "Invalid claim_text" }), { status: 400 });
  }
  
  // Rate limit server-side (3/day/device)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true })
    .eq("device_id", device_id)
    .gte("scanned_at", `${today}T00:00:00Z`);
  
  if ((count ?? 0) >= 3) {
    return new Response(
      JSON.stringify({ error: "Daily limit reached", retry_after_hours: 24 }),
      { status: 429 }
    );
  }
  
  // Call OpenAI
  const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });
  const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-5-nano";
  
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 300,
    response_format: VERDICT_SCHEMA,
    messages: [
      { role: "system", content: SYSTEM_PROMPT_DE },
      ...fewshots,
      { role: "user", content: `Claim: "${claim_text}"` }
    ]
  });
  
  const verdict = JSON.parse(completion.choices[0].message.content!);
  verdict.model_used = model;
  verdict.tokens_used = completion.usage?.total_tokens ?? 0;
  
  // Telemetry insert (NO claim_text persisted)
  await supabase.from("scans").insert({
    device_id,
    scanned_at: new Date().toISOString(),
    verdict: verdict.verdict,
    model_used: model,
    tokens_used: verdict.tokens_used
  });
  
  return new Response(JSON.stringify(verdict), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});
```

### Supabase tables SQL (run via Supabase SQL editor BEFORE deploying function)
```sql
CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  verdict text NOT NULL CHECK (verdict IN ('Vague','Verifiable','Unsupported','Substantiated')),
  shared boolean NOT NULL DEFAULT false,
  model_used text NOT NULL,
  tokens_used int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_scans_device_date 
  ON scans (device_id, scanned_at);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
-- anon cannot SELECT (privacy), function uses service role to read for rate limit
CREATE POLICY "anon no select scans" ON scans FOR SELECT TO anon USING (false);
CREATE POLICY "anon no insert scans" ON scans FOR INSERT TO anon WITH CHECK (false);
```

## FAILURE (explicit failure conditions)

Phase 01 FAILS if ANY of these conditions met:
1. Cualquier dependencia fuera del CONSTRAINTS stack whitelist. (viola REQ-A-01)
2. OpenAI API key aparece en cliente: `grep -r "OPENAI_API_KEY\|sk-" src/` returns hits. (viola REQ-S-01)
3. JSON schema validation faltante en Edge Function response OR cliente no valida con Zod. (viola REQ-F-04)
4. Rate limit no enforced server-side (test: 4 scans seguidos del mismo device_id deben retornar HTTP 429). (viola REQ-NF-02)
5. claim_text persiste en tabla `scans` (DEBE estar SOLO en submissions tabla, Phase 03). (viola REQ-S-03)
6. UI strings hardcoded en componentes: deben venir 100% de `src/locales/de.ts`. (viola REQ-NF-04)
7. Imagen full enviada a OpenAI (debe ser SOLO text post-OCR; grep "image_url" en Edge Function debe retornar 0). (viola REQ-S-02)
8. Más de 6 screens en navigator stack. (viola REQ-A-02)
9. Forbidden wording en system prompt, fewshots, UI, or any output. (viola REQ-S-04)
10. Total Phase 01 time >5h (hard stop). (viola REQ-NF-03)
11. temperature != 0.2 OR max_tokens > 300 en Edge Function. (viola REQ-A-04)
12. System prompt or few-shots hardcoded inline en Edge Function code (deben ser archivos separados importados). (viola REQ-A-05)
13. OPENAI_MODEL hardcoded sin fallback default a "gpt-5-nano". (viola REQ-A-03)
14. Falta validación UUID v4 format en Edge Function device_id input. (viola REQ-S-05)

## SDD PROTOCOL OBLIGATORIO

1. **PLAN MODE primer mensaje.** NO empezar a codear sin plan aprobado por Sebas.
2. **Pre-flight:** `ls -la /c/Users/Sdami/Projects/greenreceipt/` para entender estado actual.
3. **Cada task atómica → commit** con mensaje `feat(phase01): T{N} {description}`.
4. **Audit Level 2 self-applied** al final de cada task antes de commit:
   - Re-leer FAILURE list, verificar no se violó ninguna.
   - Re-leer REQUIREMENTS list, verificar trazabilidad de cada cambio.
   - Test smoke local (`npm start` + manual scan).
   - Confirmar TypeScript strict pasa sin `any`.
5. **NUNCA `git push` mid-phase.** Solo al final de Phase 01 cuando DoD pasa 100%.
6. **/clear entre tasks** para contexto fresco en CC.
7. **Si encuentras blocker arquitectónico** → STOP + reportar a Sebas en chat. 
   NO racionalizar shortcuts. NO inventar workarounds sin permiso.
8. **Si task excede 1.5h estimated → STOP + replan** con Sebas antes de continuar.
9. **EMPIRICAL DETERMINISM:** cada claim de "working" debe tener comando+output reproducible.
   Sin evidencia empírica = no funciona.

## 3-TASK BREAKDOWN (propose in plan mode, max 1.5h each)

- **T1 (1.5h):** Project scaffold + navigation + Camera + ML Kit OCR integration.
  - Init theme, locales/de.ts, screens skeleton with stubs
  - Camera component working (snap → preview)
  - ML Kit OCR extracts text from photo
  - DoD: snap photo of any text → see extracted text in console
  - REQs touched: REQ-F-01, REQ-F-06, REQ-NF-04, REQ-NF-05, REQ-A-01, REQ-A-02

- **T2 (1.5h):** Review screen + device_id + Supabase client + Edge Function call.
  - ReviewScreen with editable TextInput pre-filled from OCR
  - deviceId.ts service (secure-store UUID v4 lazy)
  - supabase.ts client init
  - classify.ts: POST claim_text + device_id to Edge Function
  - DoD: tap "Klassifizieren" → fetch returns JSON (can mock backend for now)
  - REQs touched: REQ-F-02, REQ-F-03, REQ-F-04, REQ-A-06

- **T3 (1h):** Supabase backend deployed (tables + Edge Function) + VerdictScreen renders response.
  - Run SQL to create `scans` table + RLS
  - Deploy Edge Function with system_prompt.ts + fewshots.json
  - Set Supabase secrets: OPENAI_API_KEY, OPENAI_MODEL=gpt-5-nano
  - VerdictScreen shows verdict + confidence + reasoning + evidence
  - DoD: real end-to-end scan from device → verdict in <8s
  - REQs touched: REQ-F-05, REQ-NF-01, REQ-NF-02, REQ-S-01, REQ-S-02, REQ-S-03, REQ-S-04, REQ-S-05, REQ-A-03, REQ-A-04, REQ-A-05

## STARTUP

Sebas pre-ejecutó Git Bash bootstrap (folder + Expo init + CLAUDE.md). 
Tu primera respuesta en este chat de CC debe ser:

```
PLAN MODE.

Pre-flight scan complete:
- [tool: ls /c/Users/Sdami/Projects/greenreceipt → list contents]
- [tool: cat CLAUDE.md → confirm rules]
- [tool: cat package.json → confirm Expo template baseline]

Proposed 3-task plan for Phase 01 Core Loop (4h budget):
1. T1 (1.5h): [scaffold + camera + OCR — full plan with file-level changes, REQ-IDs traced]
2. T2 (1.5h): [review + device_id + Supabase client — full plan, REQ-IDs traced]
3. T3 (1h):   [backend deploy + VerdictScreen — full plan, REQ-IDs traced]

Risks identified:
- [enumerate top 3-5 with mitigation]

Ready for approval? (Sebas responds: APPROVED or push-back)
```

NO code changes until Sebas approves the plan.
