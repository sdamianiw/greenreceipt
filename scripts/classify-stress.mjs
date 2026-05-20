#!/usr/bin/env node
// Deterministic 12-case stress test for the classify Edge Function.
// Reads .env.local for SUPABASE_URL + anon JWT, POSTs each case with a
// fresh device_id, prints a table + summary, exits non-zero on FAIL.
//
// Usage: node scripts/classify-stress.mjs
// Re-runnable; rate limit is per device_id so fresh UUIDs avoid it.

import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const ENV_FILE = '.env.local';
const REQUEST_DELAY_MS = 250;

const CASES = [
  { id: 1, input: 'Eco-friendly packaging', expected: 'Vague' },
  { id: 2, input: 'Planet-friendly care', expected: 'Vague' },
  { id: 3, input: 'Conscious choice for the planet', expected: 'Vague' },
  { id: 4, input: 'Bottle made with 50% recycled plastic', expected: 'Verifiable' },
  { id: 5, input: 'Packaging contains 25% recycled aluminum', expected: 'Verifiable' },
  { id: 6, input: 'Reduces CO2 emissions by 30% compared with 2020', expected: 'Verifiable' },
  { id: 7, input: '100% sustainable product', expected: 'Unsupported' },
  { id: 8, input: 'Climate neutral product since 2024', expected: 'Unsupported' },
  { id: 9, input: 'Fully recyclable packaging', expected: 'Unsupported' },
  { id: 10, input: 'Packaging contains 50% recycled material according to ISO 14021', expected: 'Substantiated' },
  { id: 11, input: 'FSC certified cardboard packaging', expected: 'Substantiated' },
  { id: 12, input: 'EU Ecolabel certified product', expected: 'Substantiated' },
];

const FORBIDDEN_WORDS = [
  'greenwashing', 'illegal', 'fraud', 'lie', 'lying', 'guilty', 'deception',
  'Betrug', 'Lüge', 'Luege', 'schuldig', 'Verbrauchertäuschung',
];

function parseEnvFile(path) {
  const raw = readFileSync(path, 'utf8');
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function classifyOne(url, anon, ocrText) {
  const deviceId = randomUUID();
  const res = await fetch(`${url}/functions/v1/classify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anon}`,
      'apikey': anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ocr_text: ocrText, device_id: deviceId }),
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { _raw: text }; }
  return { status: res.status, body };
}

function detectForbidden(s) {
  if (!s) return [];
  const hits = [];
  const lower = String(s).toLowerCase();
  for (const w of FORBIDDEN_WORDS) {
    if (lower.includes(w.toLowerCase())) hits.push(w);
  }
  return hits;
}

async function main() {
  const env = parseEnvFile(ENV_FILE);
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const anon = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.error(`Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in ${ENV_FILE}`);
    process.exit(2);
  }

  console.log(`Endpoint: ${url}/functions/v1/classify`);
  console.log(`Cases: ${CASES.length}\n`);

  const results = [];
  for (const c of CASES) {
    let actual = '-', confidence = '-', note = '', modelUsed = '-';
    try {
      const { status, body } = await classifyOne(url, anon, c.input);
      if (status !== 200) {
        actual = `ERR ${status}`;
        note = body.error ? body.error : (body._raw ? body._raw.slice(0, 60) : 'unknown');
      } else {
        actual = body.verdict || '-';
        confidence = typeof body.confidence === 'number' ? body.confidence.toFixed(2) : '-';
        modelUsed = body.model_used || '-';
        const forb = detectForbidden(body.reasoning).concat(
          (body.evidence_points || []).flatMap(detectForbidden),
        );
        if (forb.length) note = `FORBIDDEN: ${forb.join(',')}`;
        else if (actual !== c.expected) note = String(body.reasoning || '').slice(0, 70);
      }
    } catch (err) {
      actual = 'EXC';
      note = String(err.message || err).slice(0, 70);
    }
    const pass = actual === c.expected && !note.startsWith('FORBIDDEN');
    results.push({ ...c, actual, confidence, pass, note, modelUsed });
    await sleep(REQUEST_DELAY_MS);
  }

  // Table
  console.log(
    `${pad('ID', 3)}| ${pad('Input', 56)}| ${pad('Expected', 14)}| ${pad('Actual', 14)}| ${pad('Conf', 5)}| ${pad('Result', 7)}| Notes`,
  );
  console.log('-'.repeat(140));
  for (const r of results) {
    console.log(
      `${pad(r.id, 3)}| ${pad(r.input, 56)}| ${pad(r.expected, 14)}| ${pad(r.actual, 14)}| ${pad(r.confidence, 5)}| ${pad(r.pass ? 'PASS' : 'FAIL', 7)}| ${r.note}`,
    );
  }
  console.log();

  // Summary
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const byCat = {};
  for (const r of results) {
    const cat = r.expected;
    byCat[cat] ??= { ok: 0, n: 0 };
    byCat[cat].n += 1;
    if (r.pass) byCat[cat].ok += 1;
  }
  console.log(`TOTAL: ${passed}/${total}`);
  for (const cat of ['Vague', 'Verifiable', 'Unsupported', 'Substantiated']) {
    const b = byCat[cat] || { ok: 0, n: 0 };
    console.log(`  ${pad(cat, 14)} ${b.ok}/${b.n}`);
  }
  const case7 = results.find((r) => r.id === 7);
  const case7Pass = case7?.pass === true;
  console.log(`Case #7 (100% sustainable -> Unsupported): ${case7Pass ? 'PASS' : 'FAIL'}`);
  const modelsSeen = [...new Set(results.map((r) => r.modelUsed).filter((m) => m && m !== '-'))];
  console.log(`Model(s) reported: ${modelsSeen.join(', ') || 'n/a'}`);

  // PASS criteria
  const allCatsOK = ['Vague', 'Verifiable', 'Unsupported', 'Substantiated'].every(
    (c) => (byCat[c]?.ok || 0) >= 2,
  );
  const overallPass = passed >= 10 && allCatsOK && case7Pass;
  console.log(`\nRESULT: ${overallPass ? 'PASS' : 'FAIL'}`);
  process.exit(overallPass ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(2);
});
