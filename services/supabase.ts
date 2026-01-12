import { createBrowserClient } from '@supabase/ssr';

// Access env vars safely using Next.js standard
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. Check .env.local');
}

const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);

// Use global singleton in dev to prevent multiple clients contesting for locks (AbortError fix)
const singleton = (globalThis as any).supabase ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).supabase = singleton;
}

export const supabase = singleton;