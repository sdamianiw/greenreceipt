# CLAUDE.md — GreenReceipt V1.0

Behavioral guidelines for Claude Code agents. Project-specific rules
override generic ones. Bias toward caution over speed. Trivial tasks
use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the task request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add OCR" → "Photo of packaging → editable text appears in ReviewScreen"
- "Wire classify" → "Tap Klassifizieren → VerdictScreen renders valid Zod-parsed JSON"
- "Deploy function" → "curl Edge Function with test payload → 200 + schema-valid response"

For multi-step tasks, state a brief plan + verification per step.
Self-applied Audit Level 2 BEFORE declaring task complete.

---

## Project rules — GreenReceipt V1.0

### Workflow
- PLAN MODE first message every session
- `/clear` between tasks (NOT `/exit`)
- Commit atomic per task: `feat(phase01): T{N} description`
- NEVER `git push` mid-phase (only at v1.0.0 ship)

### Code constraints
- TypeScript strict: `any` uses are bugs
- No new lib without auditing stack whitelist below
- API keys NEVER client-side (grep `OPENAI_API_KEY|sk-` in `src/` must return 0)
- UI strings ONLY from `src/locales/de.ts` (no inline hardcoded strings)
- 6 screens lock (Home, Review, Verdict, Share, History, Settings) — no additions V1.0
- Conservative bias in classification prompt
- No accusatory or legal-violation wording in UI or model output
  (forbidden: greenwashing, illegal, Betrug, fraud, Lüge, schuldig, Verbrauchertäuschung)

### Stack locked (14-dep whitelist, post amendment 2026-05-14)
Expo SDK 54 + TS strict · expo-dev-client · @supabase/supabase-js ·
@react-native-ml-kit/text-recognition · expo-camera · expo-secure-store ·
expo-crypto · zod · @react-navigation/native + native-stack ·
react-native-screens · react-native-safe-area-context ·
@expo-google-fonts/{fraunces, ibm-plex-sans, ibm-plex-mono}

### Phase budget (hard caps)
- P01 Core Loop: 5h
- P02 Verdict + Share: 4h
- P03 Submit + Disclaimer: 4h
- P04 Polish + TestFlight: 4h
- TOTAL: 16h

### Model routing (Edge Function)
- Primary: `gpt-5-nano` via `OPENAI_MODEL` env
- Fallback: `gpt-4.1-nano` (env swap, no redeploy)
- `temperature=0.2`, `max_tokens=300`, `response_format=json_schema strict`

### On blocker
STOP + escalate to Sebas. NO shortcut rationalization.
If 3 fixes fail → question architecture, not patch deeper.