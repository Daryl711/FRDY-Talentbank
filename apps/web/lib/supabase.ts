import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// When env vars are missing, the dashboard uses local mock data (lib/mock.ts).
export const isSupabaseConfigured = url.startsWith("http") && anon.length > 20;

export const supabase = createClient(url || "http://localhost", anon || "anon", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
