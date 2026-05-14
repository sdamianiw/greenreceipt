# VERIFY — GreenReceipt V1.0 Phase 01 Core Loop

[ ] Development build launches on real device
[ ] Snap photo of real eco-product packaging → OCR returns editable text in ReviewScreen
[ ] Tap "Klassifizieren" → loading spinner → VerdictScreen renders JSON
[ ] Verdict matches one of: Vague | Verifiable | Unsupported | Substantiated
[ ] Response shows model_used = "gpt-5-nano" or "gpt-4.1-nano"
[ ] Response shows tokens_used > 0 and < 2000
[ ] grep -r "OPENAI_API_KEY\|sk-" src/ returns 0 matches
[ ] grep -r "Stripe\|PDF\|bulk\|teams" src/ returns 0 matches
[ ] 4th scan from same device_id within same UTC day → HTTP 429 + UI message DE
[ ] ALL visible UI text in German
[ ] npx tsc --noEmit passes
[ ] git log shows 3 atomic commits "feat(phase01): T1/T2/T3"
[ ] Phase 01 total time ≤ 5h
