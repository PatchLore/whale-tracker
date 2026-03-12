import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";
import type { Tier } from "@/types/supabase";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient();

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

