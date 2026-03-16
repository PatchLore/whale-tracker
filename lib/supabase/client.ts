import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log("[supabase] SUPABASE URL:", url);
  console.log(
    "[supabase] SUPABASE KEY:",
    key ? "present" : "missing"
  );
  if (!url || !key) return null;
  if (client) return client;
  client = createClient(url, key);
  return client;
}

