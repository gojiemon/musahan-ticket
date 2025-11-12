import { createClient } from "@supabase/supabase-js";

// Allows both our documented envs and a single SUPABASE_KEY fallback.
// - URL: prefer NEXT_PUBLIC_SUPABASE_URL, fallback SUPABASE_URL
// - Admin key: prefer SUPABASE_SERVICE_ROLE_KEY, fallback SUPABASE_KEY
// - Anon key: prefer NEXT_PUBLIC_SUPABASE_ANON_KEY, fallback SUPABASE_KEY

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) throw new Error("Supabase admin client env is missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function supabasePublicServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  if (!url || !anon) throw new Error("Supabase public client env is missing");
  return createClient(url, anon, { auth: { persistSession: false } });
}
