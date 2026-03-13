'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tier } from "@/types/supabase";

type SettingsClientProps = {
  userId?: string;
  tier?: Tier;
  telegramChatId?: string | null;
  defaultThreshold?: number | null;
};

export function SettingsClient({
  userId,
  tier = "free",
  telegramChatId = null,
  defaultThreshold = null
}: SettingsClientProps = {}) {
  const router = useRouter();
  const [telegram, setTelegram] = useState(telegramChatId ?? "");
  const [threshold, setThreshold] = useState(
    (defaultThreshold ?? 10).toString()
  );
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [resolvedUserId, setResolvedUserId] = useState<string>(userId ?? "");
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [storedTelegramId, setStoredTelegramId] = useState<string | null>(
    telegramChatId
  );

  // Client-side auth check on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        router.push("/login?redirect=/dashboard/settings");
        return;
      }
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        router.push("/login?redirect=/dashboard/settings");
        return;
      }
      const currentUserId = session.user.id;
      setResolvedUserId(currentUserId);

      // Load existing profile settings for this user
      console.log("[settings] loading profile for user:", currentUserId);
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("telegram_chat_id, default_threshold")
        .eq("id", currentUserId)
        .single();

      if (error) {
        console.error("[settings] failed to load profile:", error.message);
        return;
      }

      if (profile) {
        const tgId = (profile as { telegram_chat_id: string | null }).telegram_chat_id;
        const defaultThresh = (profile as { default_threshold: number | null })
          .default_threshold;

        setStoredTelegramId(tgId ?? null);
        setTelegram(tgId ?? "");
        setThreshold(((defaultThresh ?? 10) as number).toString());
      }
    };

    void checkAuth();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);
    const trimmedTelegram = telegram.trim();
    const numericThreshold = Number(threshold || "10");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSaving(false);
      setSaveError("Supabase is not configured.");
      return;
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();
    console.log("[settings] saving settings for user:", session?.user?.id);
    const updateUserId = session?.user?.id;
    if (!updateUserId) {
      setSaving(false);
      setSaveError("Not authenticated.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        telegram_chat_id: trimmedTelegram || null,
        default_threshold: Number.isNaN(numericThreshold)
          ? null
          : numericThreshold
      })
      .eq("id", updateUserId);

    setSaving(false);

    if (error) {
      setSaveError(error.message);
      return;
    }

    setStoredTelegramId(trimmedTelegram || null);
    setSaveSuccess("Settings saved!");

    // Clear success message after a short delay
    window.setTimeout(() => {
      setSaveSuccess(null);
    }, 3000);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  const tierLabel = tier === "pro" ? "Pro" : "Free";
  const tierColor =
    tier === "pro" ? "var(--amber)" : "var(--muted)";

  return (
    <main className="relative z-10 mx-auto max-w-3xl px-5 pt-8 pb-16">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-xl tracking-[0.3em] uppercase"
            style={{ fontFamily: "var(--font-orbitron)", color: "var(--amber)" }}
          >
            Account Settings
          </h1>
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--dim)" }}
          >
            Configure alerts and account preferences for WhaleNet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-[10px] tracking-[0.2em] uppercase border"
            style={{
              borderColor: "rgba(255,179,0,0.4)",
              color: tierColor
            }}
          >
            {tierLabel} Tier
          </span>
        </div>
      </header>

      <form
        onSubmit={handleSave}
        className="space-y-5 rounded-xl border px-5 py-5"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border2)"
        }}
      >
        <section className="space-y-2 text-xs">
          <h2
            className="text-[11px] tracking-[0.25em] uppercase"
            style={{ color: "var(--amber2)" }}
          >
            Telegram Alerts
          </h2>
          <label className="space-y-1">
            <div
              className="text-[9px] tracking-[0.2em] uppercase"
              style={{ color: "var(--muted)" }}
            >
              Telegram Chat ID
            </div>
            <input
              className="w-full rounded border px-3 py-2 outline-none text-[11px]"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border2)",
                color: "var(--amber3)",
                fontFamily: "var(--font-plex-mono)"
              }}
              placeholder="e.g. 123456789"
              value={telegram}
              onChange={e => setTelegram(e.target.value)}
            />
            <p style={{ color: "var(--dim)" }}>
              Whale alerts will be pushed to this Telegram chat when enabled in your
              browser.
            </p>
            {storedTelegramId && (
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                Currently stored chat ID:{" "}
                <span style={{ color: "var(--amber3)" }}>{storedTelegramId}</span>
              </p>
            )}
          </label>
        </section>

        <section className="space-y-2 text-xs">
          <h2
            className="text-[11px] tracking-[0.25em] uppercase"
            style={{ color: "var(--amber2)" }}
          >
            Alert Threshold
          </h2>
          <label className="space-y-1">
            <div
              className="text-[9px] tracking-[0.2em] uppercase"
              style={{ color: "var(--muted)" }}
            >
              Default Whale Threshold (ETH)
            </div>
            <input
              type="number"
              className="w-full rounded border px-3 py-2 outline-none text-[11px]"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border2)",
                color: "var(--amber3)",
                fontFamily: "var(--font-plex-mono)"
              }}
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
            />
            <p style={{ color: "var(--dim)" }}>
              New wallets will use this default threshold for whale detection.
            </p>
          </label>
        </section>

        {saveSuccess && (
          <p className="text-xs" style={{ color: "var(--green)" }}>
            {saveSuccess}
          </p>
        )}
        {saveError && (
          <p className="text-xs" style={{ color: "var(--red)" }}>
            {saveError}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 text-xs">
          <button
            type="submit"
            disabled={saving}
            className="rounded border px-4 py-2 tracking-[0.2em] uppercase"
            style={{
              borderColor: "rgba(255,179,0,0.4)",
              backgroundColor: "rgba(255,179,0,0.06)",
              color: "var(--amber)",
              fontFamily: "var(--font-orbitron)",
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>

          <button
            type="button"
            disabled={signingOut}
            onClick={handleSignOut}
            className="rounded border px-4 py-2 tracking-[0.2em] uppercase"
            style={{
              borderColor: "rgba(255,61,46,0.5)",
              color: "var(--red)",
              fontFamily: "var(--font-plex-mono)",
              opacity: signingOut ? 0.7 : 1
            }}
          >
            {signingOut ? "Signing Out…" : "Sign Out"}
          </button>
        </div>
      </form>
    </main>
  );
}

