import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const mockMode = process.env.EXPO_PUBLIC_CLASSIFY_MOCK === '1';

if (!mockMode && (!url || !anonKey)) {
  throw new Error('Supabase env missing');
}

export const supabase = createClient(
  url ?? 'http://mock.invalid',
  anonKey ?? 'mock-anon-key',
);
