export function normalizeOcrText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line, i, arr) => line.length > 0 && line !== arr[i - 1])
    .join('\n')
    .slice(0, 500);
}
