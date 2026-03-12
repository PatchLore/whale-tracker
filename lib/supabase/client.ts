import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  // These errors surface during development if env vars are missing.
  // In production you may want to handle this differently.
  // eslint-disable-next-line no-console
  console.warn("Supabase client: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.");
}

export const supabaseBrowserClient = createClient(supabaseUrl, supabaseAnonKey);

