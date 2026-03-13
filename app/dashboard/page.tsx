export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { DashboardClient } from "./DashboardClient";
import type { Wallet, Transaction } from "@/types/supabase";

export default async function DashboardPage() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // No-op in server components; mutations are handled via route handlers/middleware.
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

