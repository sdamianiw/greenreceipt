# PLAN-01-T3 — Backend Deploy + Production Wiring (v2)
# Phase 01 Core Loop · Task 3 · GreenReceipt V1.0
# Date: 2026-05-15
# Budget: 2.5h hard cap · STOP+replan si sideways

## §1 Context

Pre-flight OK: CLI 2.98.2, project linked `jflvygtjytojpeapapwd`, gpt-5-nano alive,
OpenAI key permission = Responses write, `.env.local` clean. T1+T2 done (scaffold,
camera, OCR, ReviewScreen, supabase mock client, classify.ts mock).
T3 deploya backend real (Postgres + Edge Function OpenAI Responses) y elimina mocks.

Secrets target (Supabase Function env, server-only):
- `OPENAI_API_KEY` (Responses permission)
- `OPENAI_MODEL=gpt-5-nano`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only DB access from EF)

Architecture decisions:
- OpenAI endpoint: **Responses API** (`openai.responses.create`), matches key permission, canonical for gpt-5-nano.
- Rate limit enforcement: **Edge Function pre-check** (`SELECT count WHERE device_id AND created_at > now()-24h`), short-circuit 429 antes de OpenAI call. RLS = **deny-all anon** (no policies) como defense in depth.
- DB access from EF: `SUPABASE_SERVICE_ROLE_KEY` server-only, jamás en `src/` (DoD grep).

Commit objetivo: `feat(phase01): T3 backend deploy + production wiring`

## §2 Sub-tasks

### T3.1 — SQL migration `scans` + RLS deny-all anon (≤45min)

**Step 0 (≤3min):** `supabase init` si `supabase/config.toml` ausente.

**NEW file:** `supabase/migrations/20260514_init.sql`

**Sketch (conceptual ≤15 líneas):**

```sql
create extension if not exists pgcrypto;

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  verdict text not null check (verdict in ('Vague','Verifiable','Unsupported','Substantiated')),
  confidence numeric(3,2) not null check (confidence between 0 and 1),
  model_used text not null,
  tokens_used int not null check (tokens_used >= 0),
  created_at timestamptz not null default now()
);

create index scans_device_id_created_at_idx
  on public.scans (device_id, created_at desc);

alter table public.scans enable row level security;
-- Deny-all anon: no policies created. Edge Function uses service_role exclusively.
```

**Verify (binary):**

1. `supabase db push --dry-run` → exit 0, plan = CREATE EXTENSION + CREATE TABLE + CREATE INDEX + ALTER TABLE ENABLE RLS.
2. `supabase db push` → migration applied.
3. `supabase migration list` → `20260514_init` aparece bajo columna Remote.
4. `supabase db dump --linked --schema public --schema-only | grep -c "create table .*scans"` → 1.
5. `supabase db dump --linked --schema public --schema-only | grep -c "claim_text"` → 0 (S-03 schema enforcement; no column existe).
6. `supabase db dump --linked --schema public --schema-only | grep -c "alter table .*scans enable row level security"` → 1 (RLS enabled verify).

**REQ trace:**
- NF-02 (rate limit foundation: table + index para count query rápido)
- S-03 (no `claim_text` column — privacy by schema)
- S-05 (device_id columna tipo `uuid` enforced)
- A-06 (anon role denied; service_role server-only)

**FAILURE refs:** #3 (no claim_text column), #4 (RLS inline en migration, deny-all anon)

---

### T3.2 — Edge Function `/classify` + prompts canónicos + secrets (≤75min)

**Pre-step (≤5min) — Secrets setup (manual, no echo en logs):**

```
supabase secrets set OPENAI_API_KEY=<paste from password manager>
supabase secrets set OPENAI_MODEL=gpt-5-nano
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<from Dashboard → Settings → API → service_role secret>
```

Verify: `supabase secrets list` → 3 entries (names only, no values).

**NEW files (5):**

1. `src/prompts/system_de.ts` — canonical system prompt (string export), formal alemán impersonal, conservative bias, forbidden wording filter inline en instrucciones del prompt.
2. `src/prompts/fewshots_de.json` — 8 examples (2/categoría Vague/Verifiable/Unsupported/Substantiated), array de `{role: "user"|"assistant", content: string}`.
3. `supabase/functions/classify/system_prompt.ts` — re-export string (copy-paste from canonical until V1.1 build pipeline).
4. `supabase/functions/classify/fewshots.json` — byte-eq mirror.
5. `supabase/functions/classify/index.ts` — Deno Edge Function.

**Sketch `index.ts` (conceptual ≤15 líneas):**

```ts
import OpenAI from "npm:openai@^4.67.0";
import { createClient } from "npm:@supabase/supabase-js@^2.45.0";
import { systemPrompt } from "./system_prompt.ts";
import fewshots from "./fewshots.json" with { type: "json" };

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const oa = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });
const MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-5-nano";

Deno.serve(async (req) => {
  const { ocr_text, device_id } = await req.json();
  if (!UUID_V4.test(device_id)) return Response.json({ error: "invalid device_id" }, { status: 400 });
  const { count } = await supa.from("scans").select("id", { count: "exact", head: true })
    .eq("device_id", device_id).gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
  if ((count ?? 0) >= 3) return Response.json({ error: "rate_limit_exceeded" }, { status: 429 });
  const resp = await oa.responses.create({
    model: MODEL,
    input: [{ role: "system", content: systemPrompt }, ...fewshots, { role: "user", content: ocr_text }],
    max_output_tokens: 1200,
    text: { format: { type: "json_schema", name: "VerdictResponse", schema: VerdictSchema, strict: true } }
    // temperature 0.2: include if supported by gpt-5 Responses; verify empírico T3.2 step 4 (R7)
  });
  const v = JSON.parse(resp.output_text);
  await supa.from("scans").insert({ device_id, verdict: v.verdict, confidence: v.confidence, model_used: MODEL, tokens_used: resp.usage?.total_tokens ?? 0 });
  return Response.json({ ...v, model_used: MODEL, tokens_used: resp.usage?.total_tokens ?? 0 });
});
```

**Verify (binary):**

1. `supabase functions serve classify --env-file ./supabase/.env.local` (local con secrets injected) → server up port 54321.
2. `curl -X POST http://localhost:54321/functions/v1/classify -H "Authorization: Bearer $ANON" -d '{"ocr_text":"100% biologisch abbaubar","device_id":"<uuid v4>"}'` → 200 + JSON con verdict + confidence + tokens_used > 0.
3. `for i in 1 2 3 4; do curl ... same device_id; done` → calls 1-3 = 200, call 4 = 429.
4. **Empirical check temperature:** si OpenAI Responses rechaza `temperature` param para gpt-5-nano → remove + commit note (REQ-A-04 amendment: "params locked: max_output_tokens=1200, response_format=json_schema strict; temperature pending gpt-5 API support" con sign-off Sebas).
5. `grep -R "image_url\|claim_text" supabase/functions/` → 0 (S-02, S-03).
6. `grep -Ei "greenwashing|illegal|illegale|betrug|fraud|lüge|lügen|schuldig|guilty|verbrauchertäuschung|irreführende werbung" supabase/functions/ src/prompts/` → 0 (S-04).
7. `supabase functions deploy classify` → deploy OK.
8. Smoke remote: `curl https://jflvygtjytojpeapapwd.supabase.co/functions/v1/classify ...` → P95 <8s sobre 3 runs.

**REQ trace:**
- F-04 (Responses `json_schema` strict + client Zod parse)
- F-05 (response shape: verdict + confidence + reasoning + evidence + model_used + tokens_used; render verify in T3.3)
- NF-01 (P95 <8s — `max_output_tokens 1200` + gpt-5-nano latency profile)
- NF-02 (server enforcement: EF pre-check rate 3/24h)
- S-01 (`OPENAI_API_KEY` solo en `Deno.env`; client zero refs)
- S-04 (forbidden wording filter en system prompt + tests grep)
- S-05 (UUID v4 regex server-side antes de cualquier write/call)
- A-03 (`OPENAI_MODEL` env, default gpt-5-nano)
- A-04 (`max_output_tokens: 1200`, `response_format: json_schema strict`; temperature condicional R7)
- A-05 (prompts en archivos separados, canonical client + mirror server)

**FAILURE refs:**
- #1 (key server-only en `Deno.env`)
- #2 (service_role solo en EF env, jamás en `src/`; DoD adicional grep)
- #5 (system prompt forbidden wording filter)
- #6 (`json_schema` strict + client Zod parse)
- #7 (EF pre-check `SELECT count` + 429 short-circuit + RLS deny-all anon defense in depth)
- #8 (`max_output_tokens 1200`, params locked)
- #9 (cost cap via `max_output_tokens` + rate limit + logs `tokens_used` en scans tabla)

---

### T3.3 — Client cleanup mock removal + env enforcement (≤30min)

**EDIT 1:** `src/services/classify.ts`

- Remove líneas 4-12 (`MOCK_RESPONSE` constant).
- Remove líneas 18-21 (`if EXPO_PUBLIC_CLASSIFY_MOCK` block + return mock).
- Result: 27 → ~15 líneas.

**EDIT 2:** `src/services/supabase.ts`

- Remove línea 5 (`mockMode` constant).
- Modify líneas 7-9: throw incondicional si env missing.
- Remove fallbacks líneas 12-13 (`'http://mock.invalid'`, `'mock-anon-key'`).
- Result: 14 → ~10 líneas.

**Sketch `supabase.ts` post-edit:**

```ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient(url, anonKey);
```

**Verify (binary):**

1. `grep -rn "MOCK_RESPONSE\|CLASSIFY_MOCK\|mockMode\|mock.invalid\|mock-anon-key" src/` → 0.
2. `grep -rn "SUPABASE_SERVICE_ROLE_KEY\|service_role" src/` → 0.
3. `npx tsc --noEmit` → exit 0.
4. `npm start` → device run → snap photo → tap "Klassifizieren" → VerdictScreen renders real verdict JSON.

**REQ trace:** F-04 (single Zod parse path), F-05 (VerdictScreen real data render), S-01 (cero refs OpenAI en client), A-06 (anon flow puro).

**FAILURE refs:** #10 (mock removal DoD), #2 (service_role no leak a `src/`)

---

## §3 Verification commands aggregate

| Task | Cmd | Expected |
|---|---|---|
| T3.1 | `supabase db push --dry-run` | exit 0, plan correct |
| T3.1 | `supabase migration list` post-push | `20260514_init` Remote=applied |
| T3.1 | `supabase db dump --linked --schema public --schema-only \| grep -c "create table .*scans"` | 1 |
| T3.1 | `supabase db dump --linked --schema public --schema-only \| grep -c "claim_text"` | 0 (S-03 schema enforcement) |
| T3.1 | `supabase db dump --linked --schema public --schema-only \| grep -c "alter table .*scans enable row level security"` | 1 (RLS enabled verify) |
| T3.2 | `supabase secrets list` | 3 entries: OPENAI_API_KEY, OPENAI_MODEL, SUPABASE_SERVICE_ROLE_KEY |
| T3.2 | `supabase functions serve classify` | up port 54321 |
| T3.2 | `curl -X POST localhost:54321/functions/v1/classify ...` | 200 + valid JSON |
| T3.2 | `for i in 1..4; do curl same device_id; done` | 4th=429 |
| T3.2 | `grep -R "image_url\|claim_text" supabase/functions/` | 0 |
| T3.2 | `grep -Ei "$FORBIDDEN_RE" supabase/functions/ src/prompts/` | 0 |
| T3.2 | `supabase functions deploy classify` | deployed |
| T3.3 | `grep -rn "MOCK_RESPONSE\|CLASSIFY_MOCK\|mockMode" src/` | 0 |
| T3.3 | `grep -rn "SUPABASE_SERVICE_ROLE_KEY\|service_role" src/` | 0 |
| T3.3 | `npx tsc --noEmit` | exit 0 |

## §4 DoD aggregate (7 binary)

| # | Cmd | Expected |
|---|---|---|
| 1 | `time curl https://jflvygtjytojpeapapwd.supabase.co/functions/v1/classify ...` × 3 runs | P95 <8s |
| 2 | `for i in 1..4; do curl same device_id; done` | 4th = HTTP 429 |
| 3 | `... \| jq .tokens_used` última call | int > 0 |
| 4 | `grep -R "MOCK_RESPONSE\|CLASSIFY_MOCK" src/` | 0 |
| 5 | `grep -R "sk-\|OPENAI_API_KEY\|SUPABASE_SERVICE_ROLE_KEY\|service_role" src/` | 0 |
| 6 | `npx tsc --noEmit` | exit 0 |
| 7 | `git log -1 --oneline` | `feat(phase01): T3 backend deploy + production wiring` |

DoD #5 cubre simultáneamente S-01 (OpenAI key) y la guard service_role (FAILURE #2 explicit).

## §5 Risks

| # | Risk | Prob | Impact | Mitigation |
|---|---|---|---|---|
| R1 | gpt-5-nano Responses API rechaza json_schema strict (e.g. recursive $ref) | M | H | Schema flat, no $refs; pre-test con Ajv local; fallback `OPENAI_MODEL=gpt-4.1-nano` (env swap, no redeploy) |
| R2 | EF pre-check race condition: 2 calls concurrentes pasan count check antes de insert (>3 inserts efectivos) | M | M | Aceptable V1.0 (window 24h, edge case raro). V1.1: `INSERT ... ON CONFLICT` o función plpgsql atómica con LOCK |
| R3 | `supabase functions serve` local difiere de prod Deno runtime (npm: imports) | L | M | Smoke remote post-deploy obligatorio (verify §3 last row); rollback `supabase functions delete classify` si falla |
| R4 | T3.2 excede 75min (OpenAI SDK Deno debugging, prompts iteration) | M | M | STOP+replan a 60min; fallback hand-rolled fetch a `https://api.openai.com/v1/responses` (~10 líneas) si SDK Deno bug |
| R5 | Mock removal rompe T1/T2 commits si referencia residual (e.g. tests) | L | M | Pre-edit grep exhaustivo `EXPO_PUBLIC_CLASSIFY_MOCK` en todo `src/`; remover en mismo commit |
| R6 | Cost runaway durante testing iteration (>€20/mes proyectado NF-02 implicit) | L | M | `max_output_tokens 1200` + RL 3/day device + revisar `tokens_used` post-T3; OpenAI dashboard usage cap manual |
| R7 | gpt-5-nano Responses API no soporta `temperature` param (gpt-5 reasoning models lock temp) — viola REQ-A-04 literal | M | M | T3.2 step 4 empirical check; si rechaza → omit + amendment REQ-A-04 ("params locked: max_output_tokens=1200 + response_format strict; temperature pending API support gpt-5 family") con sign-off Sebas |
| R8 | `SUPABASE_SERVICE_ROLE_KEY` leak accidental a `.env.local` o `src/` | L | H | DoD #5 grep en cada commit; `.env.local` en `.gitignore` (verify); pre-commit hook V1.1 (out of scope V1.0) |

## §6 Rollback per task

- **T3.1:** `supabase migration repair --status reverted 20260514` + manual `drop table public.scans cascade` via Supabase SQL Editor.
- **T3.2:** `supabase functions delete classify` + `git restore supabase/functions/classify/ src/prompts/` + `supabase secrets unset OPENAI_API_KEY OPENAI_MODEL` (**if CLI supports**; otherwise rotate/delete manual via Supabase Dashboard → Settings → Edge Function Secrets). `SUPABASE_SERVICE_ROLE_KEY`: NO rotar trivialmente — si exposed, rotate manual via Dashboard → Settings → API → Roll service_role key.
- **T3.3:** `git restore src/services/classify.ts src/services/supabase.ts`.

## §7 Handback prompt claude.ai N3 (≤500 chars)

```
T3 done GreenReceipt Phase 01. Migration 20260514 scans table + RLS deny-all anon. Edge Fn classify deployed, gpt-5-nano Responses API, max_output_tokens 1200, json_schema strict. Rate limit 3/24h via EF pre-check (service_role server-only). Prompts canónicos src/prompts/{system_de,fewshots_de} + mirror. Mock 0. DoD 7/7: <8s P95, 4th=429, tokens>0, grep MOCK/sk-/service_role=0, tsc OK, commit feat(phase01):T3. Próximo: Phase 02 Verdict+Share. ¿Audit L2 pasa?
```

(497 chars)

## §8 Self-audit PASS/NO-PASS

| Check | Status |
|---|---|
| 3 sub-tasks ≤2.5h cap | PASS |
| REQ trace completo (F-04, F-05, NF-01, NF-02, S-01, S-03, S-04, S-05, A-03, A-04, A-05, A-06 = 12 IDs) | PASS |
| FAILURE 10/10 con mecanismo ejecutable | PASS |
| DoD 7/7 binary executable | PASS |
| Risks ≥5 (now 8) prob/impact/mitigation | PASS |
| Rollback per task explicit (hedged where CLI uncertain) | PASS |
| Handback ≤500 chars | PASS (497) |
| OpenAI endpoint matches key permission (Responses API) | PASS |
| Rate limit mechanism executable (EF pre-check, no JWT claim dependency) | PASS |
| Service role server-only (Deno.env, grep DoD `src/`=0) | PASS |
| Secrets precondition explicit (T3.2 pre-step `supabase secrets set` × 3) | PASS |
| Verification commands use Supabase CLI (no psql) | PASS |
| FAILURE #7 mapped to executable mechanism (EF pre-check + RLS deny-all defense in depth) | PASS |
| Honest hedging on temperature unknown (R7) instead of asserting | PASS |
| Schema enforcement DoD: claim_text=0 + RLS enable=1 (audit fixes) | PASS |
| **OVERALL** | **PASS** |
