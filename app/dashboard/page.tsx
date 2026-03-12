import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";
import type { Wallet, Transaction } from "@/types/supabase";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login?redirect=/dashboard");
  }

  const userId = session.user.id;

  const [{ data: profile }, { data: wallets }, { data: transactions }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("tier, telegram_chat_id, default_threshold")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
    ]);

  const tier = (profile?.tier as "free" | "pro") ?? "free";
  const telegramChatId = (profile?.telegram_chat_id as string | null) ?? null;
  const defaultThreshold =
    (profile?.default_threshold as number | null) ?? null;

  return (
    <DashboardClient
      userId={userId}
      tier={tier}
      telegramChatId={telegramChatId}
      defaultThreshold={defaultThreshold}
      initialWallets={(wallets ?? []) as Wallet[]}
      initialTransactions={(transactions ?? []) as Transaction[]}
    />
  );
}

