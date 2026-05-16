// Standalone verification of normalizeOcrText behavior.
// Run: node scripts/verify-ocr-normalize.mjs
// Mirrors src/services/ocrNormalize.ts -- if algorithm changes, update both.

function normalize(raw) {
  return raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter((l, i, arr) => l.length > 0 && l !== arr[i - 1])
    .join('\n')
    .slice(0, 500);
}

const cases = [
  ['  hello  ',                 'hello',                  'trims whitespace'],
  ['a\n\n\nb',                  'a\nb',                   'removes empty lines'],
  ['a\na\nb',                   'a\nb',                   'removes consecutive dupes'],
  ['line   with    tabs\there', 'line with tabs here',    'collapses tabs/spaces'],
  ['70% recycelt',              '70% recycelt',           'preserves %'],
  ['CO2-neutral',               'CO2-neutral',            'preserves CO2'],
  ['CO₂-neutral',          'CO₂-neutral',       'preserves CO2 unicode subscript'],
  ['FSC-C123456',               'FSC-C123456',            'preserves FSC code'],
  ['ISO 14001',                 'ISO 14001',              'preserves ISO ref'],
  ['EN 13432',                  'EN 13432',               'preserves EN ref'],
  ['x'.repeat(600),             'x'.repeat(500),          'caps to 500 chars'],
  ['\r\nfoo\r\nbar\r\n',        'foo\nbar',               'CRLF normalized'],
];

let fail = 0;
for (const [input, expected, label] of cases) {
  const got = normalize(input);
  if (got !== expected) {
    console.error(`FAIL [${label}]: ${JSON.stringify(input)} -> ${JSON.stringify(got)} (expected ${JSON.stringify(expected)})`);
    fail++;
  } else {
    console.log(`ok   [${label}]`);
  }
}
if (fail > 0) {
  console.error(`${fail} test(s) failed`);
  process.exit(1);
} else {
  console.log('all passed');
}
