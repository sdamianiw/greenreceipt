# GreenReceipt V1.0

React Native / Expo app for the German market: photograph product packaging, OCR the text, classify the environmental claims on it. German UI, classification via a Supabase Edge Function calling OpenAI.

Behavioral guidelines live in the global skills (`karpathy-guidelines`, `plan-preflight`) and `~/.claude/CLAUDE.md` — not repeated here. Below is only what is specific to this project.

## Workflow
- PLAN MODE first message every session · `/clear` between tasks (never `/exit`)
- One atomic commit per task: `feat(phase01): T{N} description`
- **G7 commit footer:** both the failing and the passing verification output go in the commit message footer (RED-first itself is the global standard)
- NEVER `git push` mid-phase — only at v1.0.0 ship
- `EXPORTAR CHAT` → handoff + relevant memories + transfer `.md` + start a new chat (also when context passes ~20 dense exchanges)

## Code constraints
- TypeScript strict: an `any` is a bug
- No new library without auditing it against the whitelist below
- API keys NEVER client-side — `grep 'OPENAI_API_KEY|sk-' src/` must return 0
- UI strings ONLY from `src/locales/de.ts`; no inline hardcoded strings
- **6 screens locked** (Home, Review, Verdict, Share, History, Settings) — no additions in V1.0
- Conservative bias in the classification prompt
- No accusatory or legal-violation wording in UI or model output — forbidden: greenwashing, illegal, Betrug, fraud, Lüge, schuldig, Verbrauchertäuschung

## Stack locked (14-dep whitelist, post amendment 2026-05-14)
Expo SDK 54 + TS strict · expo-dev-client · @supabase/supabase-js · @react-native-ml-kit/text-recognition · expo-camera · expo-secure-store · expo-crypto · zod · @react-navigation/native + native-stack · react-native-screens · react-native-safe-area-context · @expo-google-fonts/{fraunces, ibm-plex-sans, ibm-plex-mono}

## Phase budget (hard caps)
P01 Core Loop 5h · P02 Verdict + Share 4h · P03 Submit + Disclaimer 4h · P04 Polish + TestFlight 4h · **total 16h**, inside the 8-10h/week ceiling for this project.

## Model routing (Edge Function)
- Primary `gpt-5-nano` via `OPENAI_MODEL` env; fallback `gpt-4.1-nano` (env swap, no redeploy)
- `temperature=0.2`, `max_tokens=1200`, `response_format=json_schema strict`

## On blocker
STOP and escalate. No shortcut rationalization. If three fixes fail, question the architecture instead of patching deeper.
