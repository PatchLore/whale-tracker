export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { SettingsClient } from "./SettingsClient";
import type { Tier } from "@/types/supabase";

export default async function SettingsPage() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // No-op here; cookie mutations are handled in middleware/route handlers.
        setAll() {
          return;
        }
      }
    }
  );

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login?redirect=/dashboard/settings");
  }

  const userId = session.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, telegram_chat_id, default_threshold")
    .eq("id", userId)
    .maybeSingle();

  const tier: Tier = (profile?.tier as Tier) ?? "free";
  const telegramChatId = (profile?.telegram_chat_id as string | null) ?? null;
  const defaultThreshold =
    (profile?.default_threshold as number | null) ?? null;

  return (
    <SettingsClient
      userId={userId}
      tier={tier}
      telegramChatId={telegramChatId}
      defaultThreshold={defaultThreshold}
    />
  );
}

