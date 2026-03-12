import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client configured for server-side usage.
 *
 * It reads the `sb-access-token` from cookies (if present) and attaches it
 * as a bearer token on all requests so RLS policies evaluate for the
 * authenticated user.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      : {}
  });

  return client;
}

