"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { usePolling } from "@/lib/hooks/usePolling";
import type { Tier, WalletChain, Wallet, Transaction } from "@/types/supabase";

type DashboardClientProps = {
  userId?: string;
  tier?: Tier;
  telegramChatId?: string | null;
  defaultThreshold?: number | null;
  initialWallets?: Wallet[];
  initialTransactions?: Transaction[];
};

const FREE_LIMIT = 3;
const PRO_LIMIT = 50;

export function DashboardClient({
  userId,
  tier = "free",
  telegramChatId = null,
  defaultThreshold = null,
  initialWallets = [],
  initialTransactions = []
}: DashboardClientProps = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [feedFilter, setFeedFilter] = useState<"all" | "whale" | "incoming" | "outgoing">(
    "all"
  );
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [telegramChatIdState, setTelegramChatIdState] = useState<string | null>(
    telegramChatId
  );
  const [hasRequestedNotifications, setHasRequestedNotifications] = useState(false);
  const [showUpgradeToast, setShowUpgradeToast] = useState(false);

  const walletLimit = tier === "pro" ? PRO_LIMIT : FREE_LIMIT;

  useEffect(() => {
    // On mount, refresh from Supabase to ensure fresh state.
    const load = async () => {
      setIsLoadingWallets(true);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setIsLoadingWallets(false);
        return;
      }
      const [{ data: walletData }, { data: txData }] = await Promise.all([
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

      if (walletData) {
        setWallets(walletData as Wallet[]);
      }
      if (txData) {
        setTransactions(txData as Transaction[]);
      }
      setIsLoadingWallets(false);
    };

    void load();
  }, [userId]);

  // Show upgrade toast once when coming back from Stripe
  useEffect(() => {
    const upgraded = searchParams.get("upgraded");
    if (upgraded === "true") {
      setShowUpgradeToast(true);
      // Strip the query param to avoid repeated toasts on reload
      router.replace("/dashboard");
    }
  }, [router, searchParams]);

  // Browser notification permission on dashboard load
  useEffect(() => {
    if (hasRequestedNotifications) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().finally(() => {
        setHasRequestedNotifications(true);
      });
    } else {
      setHasRequestedNotifications(true);
    }
  }, [hasRequestedNotifications]);

  const stats = useMemo(() => {
    const txCount = transactions.length;
    const whaleAlerts = transactions.filter(t => t.is_whale).length;
    const largestMove =
      transactions.reduce<number>((max, t) => {
        const v = t.eth_value ?? 0;
        return v > max ? v : max;
      }, 0) || null;
    return { txCount, whaleAlerts, largestMove };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (feedFilter === "all") return transactions;
    if (feedFilter === "whale") return transactions.filter(t => t.is_whale);
    return transactions.filter(t => t.direction === feedFilter);
  }, [transactions, feedFilter]);

  // Attach polling engine (Etherscan + Supabase)
  usePolling({
    tier,
    wallets,
    telegramChatId,
    onNewTransactions: (_walletId, newTxs) => {
      setTransactions(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const merged = [...newTxs.filter(t => !existingIds.has(t.id)), ...prev];
        // Keep most recent first assuming created_at desc from API
        return merged.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
      });
    }
  });

  const handleAddWallet = async (payload: {
    label: string;
    address: string;
    chain: WalletChain;
    threshold: number;
  }) => {
    if (wallets.length >= walletLimit) {
      // eslint-disable-next-line no-alert
      alert(
        tier === "pro"
          ? `Pro tier limit reached (${PRO_LIMIT} wallets).`
          : `Free tier limit reached (${FREE_LIMIT} wallets). Upgrade to Pro for more slots.`
      );
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // eslint-disable-next-line no-alert
      alert("Supabase is not configured.");
      return;
    }

    const { data, error } = await supabase
      .from("wallets")
      .insert({
        user_id: userId,
        label: payload.label || null,
        address: payload.address,
        chain: payload.chain,
        threshold: payload.threshold
      })
      .select("*")
      .single();

    if (error) {
      // eslint-disable-next-line no-alert
      alert(error.message);
      return;
    }

    setWallets(prev => [...prev, data as Wallet]);
  };

  const handleRemoveWallet = async (walletId: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // eslint-disable-next-line no-alert
      alert("Supabase is not configured.");
      return;
    }

    const { error } = await supabase
      .from("wallets")
      .delete()
      .eq("id", walletId);

    if (error) {
      // eslint-disable-next-line no-alert
      alert(error.message);
      return;
    }

    setWallets(prev => prev.filter(w => w.id !== walletId));
    setTransactions(prev => prev.filter(t => t.wallet_id !== walletId));
  };

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-5 pt-7 pb-20">
      {showUpgradeToast && (
        <div className="mb-4 rounded-lg border px-4 py-3 text-sm shadow-lg" style={{ borderColor: "var(--amber)", backgroundColor: "rgba(255,179,0,0.12)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs tracking-[0.25em] uppercase" style={{ color: "var(--amber2)", fontFamily: "var(--font-orbitron)" }}>
                Welcome to WhaleNet Pro
              </div>
              <div className="mt-1 text-[11px]" style={{ color: "var(--text2)" }}>
                Your account has been upgraded. Pro limits and faster polling are now active.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowUpgradeToast(false)}
              className="text-xs"
              style={{ color: "var(--dim)" }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <Header />

      <StatsBar
        tier={tier}
        walletCount={wallets.length}
        txCount={stats.txCount}
        whaleAlerts={stats.whaleAlerts}
        largestMove={stats.largestMove}
      />

      <div className="grid gap-4 md:grid-cols-[340px,1fr]">
        <div>
          <WalletRegistry
            tier={tier}
            walletLimit={walletLimit}
            walletCount={wallets.length}
            wallets={wallets}
            onAddWallet={handleAddWallet}
            onRemoveWallet={handleRemoveWallet}
            isLoading={isLoadingWallets}
            userId={userId}
            telegramChatId={telegramChatIdState}
            onTelegramChatIdChange={setTelegramChatIdState}
            defaultThreshold={defaultThreshold}
          />
        </div>
        <div>
          <ActivityFeed
            transactions={filteredTransactions}
            totalCount={transactions.length}
            filter={feedFilter}
            onFilterChange={setFeedFilter}
            hasWallets={wallets.length > 0}
          />
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div
          className="font-bold tracking-[0.5em] text-3xl sm:text-4xl md:text-5xl"
          style={{
            fontFamily: "var(--font-orbitron)",
            color: "var(--amber)",
            textShadow:
              "0 0 40px rgba(255,179,0,0.4), 0 0 80px rgba(255,179,0,0.15)"
          }}
        >
          WHALE<span style={{ color: "var(--amber2)" }}>NET</span>
        </div>
        <p
          className="mt-2 text-[10px] tracking-[0.35em] uppercase"
          style={{ color: "var(--muted)", fontFamily: "var(--font-plex-mono)" }}
        >
          {/* REAL-TIME WALLET INTELLIGENCE · TRACK · ALERT · FOLLOW */}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 text-[10px]">
        <div className="inline-flex items-center gap-2 rounded border border-[rgba(57,255,110,0.3)] bg-[rgba(57,255,110,0.08)] px-3 py-1 tracking-[0.3em] text-[10px] uppercase text-[var(--green)]">
          <span className="h-[7px] w-[7px] rounded-full bg-[var(--green)] animate-pulse" />
          MONITORING ACTIVE
        </div>
      </div>
    </header>
  );
}

type StatsBarProps = {
  tier: Tier;
  walletCount: number;
  txCount: number;
  whaleAlerts: number;
  largestMove: number | null;
};

function StatsBar({
  tier,
  walletCount,
  txCount,
  whaleAlerts,
  largestMove
}: StatsBarProps) {
  const walletLimit = tier === "pro" ? PRO_LIMIT : FREE_LIMIT;
  const pollInterval = tier === "pro" ? "30s" : "60s";

  return (
    <section
      className="mb-6 grid gap-px overflow-hidden rounded-lg border border-[var(--border)]"
      style={{ backgroundColor: "var(--border)" }}
    >
      <StatCell
        label="WALLETS TRACKED"
        value={walletCount.toString()}
        sub={`of ${walletLimit} ${tier === "pro" ? "pro slots" : "free slots"}`}
      />
      <StatCell
        label="TRANSACTIONS SEEN"
        value={txCount.toString()}
        sub="this session"
      />
      <StatCell
        label="WHALE ALERTS"
        value={whaleAlerts.toString()}
        sub="above threshold"
        valueColor="var(--amber)"
      />
      <StatCell
        label="LARGEST MOVE"
        value={largestMove ? `${largestMove.toFixed(1)} ETH` : "—"}
        sub="this session"
      />
      <StatCell
        label="POLL INTERVAL"
        value={pollInterval}
        sub={tier === "pro" ? "30s on pro tier" : "60s on free tier"}
      />
    </section>
  );
}

type StatCellProps = {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
};

function StatCell({ label, value, sub, valueColor }: StatCellProps) {
  return (
    <div
      className="bg-[var(--surface)] px-4 py-3"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <div
        className="mb-1 text-[9px] tracking-[0.3em] uppercase"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </div>
      <div
        className="text-xl font-bold"
        style={{
          fontFamily: "var(--font-orbitron)",
          color: valueColor ?? "var(--amber3)"
        }}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px]" style={{ color: "var(--dim)" }}>
        {sub}
      </div>
    </div>
  );
}

type WalletRegistryProps = {
  tier: Tier;
  walletLimit: number;
  walletCount: number;
  wallets: Wallet[];
  isLoading: boolean;
  onAddWallet: (payload: {
    label: string;
    address: string;
    chain: WalletChain;
    threshold: number;
  }) => void;
  onRemoveWallet: (walletId: string) => void;
  userId: string;
  telegramChatId: string | null;
  onTelegramChatIdChange: (value: string | null) => void;
  defaultThreshold: number | null;
};

function WalletRegistry({
  tier,
  walletLimit,
  walletCount,
  wallets,
  isLoading,
  onAddWallet,
  onRemoveWallet,
  userId,
  telegramChatId,
  onTelegramChatIdChange,
  defaultThreshold
}: WalletRegistryProps) {
  return (
    <section
      className="overflow-hidden rounded-xl border"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border2)" }}
    >
      <header
        className="flex items-center justify-between border-b px-4 py-3"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "rgba(255,179,0,0.03)"
        }}
      >
        <div
          className="text-[11px] uppercase tracking-[0.3em]"
          style={{ fontFamily: "var(--font-orbitron)", color: "var(--amber2)" }}
        >
          ⬡ WALLET REGISTRY
        </div>
        <div className="text-[10px]" style={{ color: "var(--muted)" }}>
          {walletLimit - walletCount} SLOTS FREE
        </div>
      </header>
      <div className="px-4 py-4">
        <AddWalletForm
          disabled={walletCount >= walletLimit}
          onSubmit={onAddWallet}
          defaultThreshold={defaultThreshold}
        />

        <div className="mt-4 space-y-2">
          {isLoading && wallets.length === 0 ? (
            <div className="space-y-2">
              {[0, 1, 2].map(i => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton only
                  key={i}
                  className="h-16 w-full rounded-lg border animate-pulse"
                  style={{
                    backgroundColor: "rgba(255,179,0,0.04)",
                    borderColor: "rgba(255,179,0,0.18)"
                  }}
                />
              ))}
            </div>
          ) : wallets.length === 0 ? (
            <p
              className="py-5 text-center text-[10px]"
              style={{ color: "var(--dim)" }}
            >
              No wallets added yet.{" "}
              {tier === "pro"
                ? "Add up to 50 wallets on Pro."
                : "Add up to 3 wallets on the free tier."}
            </p>
          ) : (
            wallets.map(w => (
              <WalletCard
                key={w.id}
                wallet={w}
                onRemove={() => onRemoveWallet(w.id)}
              />
            ))
          )}
        </div>

        <TelegramSettings
          userId={userId}
          value={telegramChatId}
          onChange={onTelegramChatIdChange}
        />

        <ProBanner tier={tier} />
      </div>
    </section>
  );
}

type AddWalletFormProps = {
  disabled: boolean;
  onSubmit: (payload: {
    label: string;
    address: string;
    chain: WalletChain;
    threshold: number;
  }) => void;
  defaultThreshold: number | null;
};

function AddWalletForm({ disabled, onSubmit, defaultThreshold }: AddWalletFormProps) {
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [threshold, setThreshold] = useState(
    (defaultThreshold ?? 10).toString()
  );
  const [chain, setChain] = useState<WalletChain>("ethereum");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setThreshold((defaultThreshold ?? 10).toString());
  }, [defaultThreshold]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      // eslint-disable-next-line no-alert
      alert("Please enter a wallet address.");
      return;
    }

    const numericThreshold = Number(threshold || "10");
    if (Number.isNaN(numericThreshold) || numericThreshold <= 0) {
      // eslint-disable-next-line no-alert
      alert("Threshold must be a positive number.");
      return;
    }

    setSubmitting(true);
    await onSubmit({
      label: label.trim() || address.trim().slice(0, 10),
      address: address.trim(),
      chain,
      threshold: numericThreshold
    });
    setSubmitting(false);
    setLabel("");
    setAddress("");
  };

  const isDisabled = disabled || submitting;

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-2 text-[11px]"
    >
      <div>
        <div
          className="mb-1 text-[9px] tracking-[0.2em] uppercase"
          style={{ color: "var(--muted)" }}
        >
          WALLET LABEL
        </div>
        <input
          className="w-full rounded border px-3 py-2 outline-none"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border2)",
            color: "var(--amber3)",
            fontFamily: "var(--font-plex-mono)"
          }}
          placeholder="e.g. Justin Sun Wallet"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
      </div>
      <div>
        <div
          className="mb-1 text-[9px] tracking-[0.2em] uppercase"
          style={{ color: "var(--muted)" }}
        >
          WALLET ADDRESS (ETH/SOL)
        </div>
        <input
          className="w-full rounded border px-3 py-2 outline-none"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border2)",
            color: "var(--amber3)",
            fontFamily: "var(--font-plex-mono)"
          }}
          placeholder="0x... or base58..."
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div
            className="mb-1 text-[9px] tracking-[0.2em] uppercase"
            style={{ color: "var(--muted)" }}
          >
            ALERT THRESHOLD (ETH)
          </div>
          <input
            type="number"
            className="w-full rounded border px-3 py-2 outline-none"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border2)",
              color: "var(--amber3)",
              fontFamily: "var(--font-plex-mono)"
            }}
            value={threshold}
            onChange={e => setThreshold(e.target.value)}
          />
        </div>
        <div>
          <div
            className="mb-1 text-[9px] tracking-[0.2em] uppercase"
            style={{ color: "var(--muted)" }}
          >
            CHAIN
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {(["ethereum", "bsc", "solana"] as WalletChain[]).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setChain(option)}
                className="rounded border px-3 py-1 text-[9px] tracking-[0.2em] uppercase transition"
                style={{
                  borderColor:
                    chain === option ? "var(--amber2)" : "var(--border)",
                  backgroundColor:
                    chain === option
                      ? "rgba(255,140,0,0.08)"
                      : "transparent",
                  color:
                    chain === option ? "var(--amber2)" : "var(--muted)",
                  fontFamily: "var(--font-plex-mono)"
                }}
              >
                {option === "ethereum"
                  ? "ETH"
                  : option === "bsc"
                  ? "BSC"
                  : "SOL"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        className="mt-1 w-full rounded border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.25em] transition"
        style={{
          borderColor: "rgba(255,179,0,0.4)",
          backgroundColor: "rgba(255,179,0,0.1)",
          color: "var(--amber)",
          fontFamily: "var(--font-orbitron)",
          opacity: isDisabled ? 0.6 : 1,
          cursor: isDisabled ? "not-allowed" : "pointer"
        }}
      >
        + Add Wallet
      </button>
    </form>
  );
}

type WalletCardProps = {
  wallet: Wallet;
  onRemove: () => void;
};

function WalletCard({ wallet, onRemove }: WalletCardProps) {
  return (
    <div
      className="relative rounded-lg border px-3 py-3"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: "var(--green)" }}
        />
        <div
          className="flex-1 text-xs"
          style={{ color: "var(--amber3)" }}
        >
          {wallet.label || wallet.address}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-[10px]"
          style={{ color: "var(--dim)" }}
        >
          ✕
        </button>
      </div>
      <div
        className="mb-2 break-all text-[10px]"
        style={{ color: "var(--muted)" }}
      >
        {wallet.address}
      </div>
      <div className="flex gap-4 text-[10px]">
        <div>
          <div
            className="text-[9px] tracking-[0.15em] uppercase"
            style={{ color: "var(--dim)" }}
          >
            Chain
          </div>
          <div style={{ color: "var(--amber)" }}>
            {wallet.chain.toUpperCase()}
          </div>
        </div>
        <div>
          <div
            className="text-[9px] tracking-[0.15em] uppercase"
            style={{ color: "var(--dim)" }}
          >
            Threshold
          </div>
          <div style={{ color: "var(--amber)" }}>
            {wallet.threshold ?? "—"} ETH
          </div>
        </div>
      </div>
    </div>
  );
}

type ProBannerProps = {
  tier: Tier;
};

function ProBanner({ tier }: ProBannerProps) {
  if (tier === "pro") return null;

  return (
    <div
      className="mt-3 rounded-lg px-4 py-3 text-center"
      style={{
        backgroundColor: "rgba(255,179,0,0.06)",
        border: "1px solid rgba(255,179,0,0.25)"
      }}
    >
      <div
        className="mb-1 text-sm tracking-[0.3em] uppercase"
        style={{ fontFamily: "var(--font-orbitron)", color: "var(--amber)" }}
      >
        ⬡ WHALENET PRO
      </div>
      <p
        className="mb-2 text-[10px] leading-relaxed"
        style={{ color: "var(--muted)" }}
      >
        Track up to 50 wallets · Telegram + Discord alerts
        <br />
        1-minute polling · Multi-chain · CSV export
      </p>
      <button
        type="button"
        className="rounded-md px-4 py-2 text-[11px] tracking-[0.2em] uppercase"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--amber), var(--amber2))",
          color: "var(--bg)",
          fontFamily: "var(--font-orbitron)"
        }}
        onClick={async () => {
          try {
            const res = await fetch("/api/stripe/checkout", {
              method: "POST"
            });
            if (!res.ok) {
              // eslint-disable-next-line no-alert
              alert("Unable to start checkout. Please try again.");
              return;
            }
            const data = (await res.json()) as { url?: string };
            if (data.url) {
              window.location.href = data.url;
            }
          } catch {
            // eslint-disable-next-line no-alert
            alert("Stripe checkout failed. Please try again.");
          }
        }}
      >
        Upgrade · $15/mo
      </button>
    </div>
  );
}

type TelegramSettingsProps = {
  userId: string;
  value: string | null;
  onChange: (value: string | null) => void;
};

function TelegramSettings({ userId, value, onChange }: TelegramSettingsProps) {
  const [input, setInput] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const trimmed = input.trim();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSaving(false);
      // eslint-disable-next-line no-alert
      alert("Supabase is not configured.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ telegram_chat_id: trimmed || null })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      // eslint-disable-next-line no-alert
      alert(error.message);
      return;
    }

    onChange(trimmed || null);
  };

  return (
    <form onSubmit={handleSave} className="mt-4 space-y-1 text-[10px]">
      <div
        className="text-[9px] tracking-[0.2em] uppercase"
        style={{ color: "var(--muted)" }}
      >
        TELEGRAM CHAT ID
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
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <p style={{ color: "var(--dim)" }}>
        Whale alerts will be pushed to this Telegram chat when enabled.
      </p>
      <button
        type="submit"
        disabled={saving}
        className="mt-1 rounded border px-3 py-1 text-[10px] tracking-[0.2em] uppercase"
        style={{
          borderColor: "rgba(255,179,0,0.4)",
          backgroundColor: "rgba(255,179,0,0.06)",
          color: "var(--amber)",
          fontFamily: "var(--font-orbitron)",
          opacity: saving ? 0.7 : 1
        }}
      >
        {saving ? "Saving…" : "Save Telegram ID"}
      </button>
    </form>
  );
}

type ActivityFeedProps = {
  transactions: Transaction[];
  totalCount: number;
  filter: "all" | "whale" | "incoming" | "outgoing";
  onFilterChange: (f: "all" | "whale" | "incoming" | "outgoing") => void;
  hasWallets: boolean;
};

function ActivityFeed({
  transactions,
  totalCount,
  filter,
  onFilterChange,
  hasWallets
}: ActivityFeedProps) {
  const countLabel =
    totalCount === 1 ? "1 event" : `${totalCount.toString()} events`;

  return (
    <section
      className="flex h-full flex-col overflow-hidden rounded-xl border"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border2)" }}
    >
      <header
        className="flex items-center justify-between border-b px-4 py-3"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "rgba(255,179,0,0.03)"
        }}
      >
        <div
          className="text-[11px] uppercase tracking-[0.3em]"
          style={{ fontFamily: "var(--font-orbitron)", color: "var(--amber2)" }}
        >
          ⬡ LIVE ACTIVITY FEED
        </div>
        <div className="flex items-center gap-2 text-[9px]">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "var(--green)" }}
          />
          <span
            className="tracking-[0.2em] uppercase"
            style={{ color: "var(--green)" }}
          >
            Polling
          </span>
        </div>
      </header>
      <div className="flex flex-1 flex-col px-4 py-3">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[9px]">
          <FeedFilterButton
            label="ALL"
            active={filter === "all"}
            onClick={() => onFilterChange("all")}
          />
          <FeedFilterButton
            label="🐋 WHALE"
            active={filter === "whale"}
            onClick={() => onFilterChange("whale")}
          />
          <FeedFilterButton
            label="INCOMING"
            active={filter === "incoming"}
            onClick={() => onFilterChange("incoming")}
          />
          <FeedFilterButton
            label="OUTGOING"
            active={filter === "outgoing"}
            onClick={() => onFilterChange("outgoing")}
          />
          <span
            className="ml-auto text-[10px]"
            style={{ color: "var(--dim)" }}
          >
            {countLabel}
          </span>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto pb-2">
          {transactions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-[11px]">
              <div className="text-2xl opacity-40">
                {hasWallets ? (filter === "whale" ? "🐋" : "📡") : "🐋"}
              </div>
              <div style={{ color: "var(--dim)" }}>
                {!hasWallets
                  ? "Add a wallet to start tracking movements."
                  : filter === "whale"
                  ? "No whale events yet. When a move crosses your threshold it will appear here."
                  : "No transactions yet. As soon as we detect activity it will stream into this feed."}
              </div>
            </div>
          ) : (
            transactions.slice(0, 50).map(tx => (
              <TxCard key={tx.id} tx={tx} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

type FeedFilterButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function FeedFilterButton({ label, active, onClick }: FeedFilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border px-3 py-1 text-[9px] tracking-[0.2em] uppercase transition"
      style={{
        borderColor: active ? "var(--amber2)" : "var(--border)",
        backgroundColor: active ? "rgba(255,140,0,0.08)" : "transparent",
        color: active ? "var(--amber2)" : "var(--muted)",
        fontFamily: "var(--font-plex-mono)"
      }}
    >
      {label}
    </button>
  );
}

type TxCardProps = {
  tx: Transaction;
};

function TxCard({ tx }: TxCardProps) {
  const isWhale = Boolean(tx.is_whale);
  const direction = tx.direction;

  const badgeText = isWhale
    ? "🐋 WHALE MOVE"
    : direction === "incoming"
    ? "↓ INCOMING"
    : "↑ OUTGOING";

  const eth = tx.eth_value ?? 0;
  const ethBig = eth >= 100;

  const created = tx.block_timestamp
    ? new Date(Number(tx.block_timestamp) * 1000)
    : new Date(tx.created_at);

  const ago = timeAgo(created);

  const explorerHref = tx.hash.startsWith("0x")
    ? `https://etherscan.io/tx/${tx.hash}`
    : undefined;

  return (
    <article
      className="relative overflow-hidden rounded-lg border px-4 py-3 text-[11px]"
      style={{
        backgroundColor: "var(--card)",
        borderColor: isWhale
          ? "var(--amber)"
          : direction === "incoming"
          ? "var(--green)"
          : "var(--red)"
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="border px-2 py-0.5 text-[9px] tracking-[0.2em] uppercase"
          style={{
            borderColor: isWhale
              ? "rgba(255,179,0,0.4)"
              : direction === "incoming"
              ? "rgba(57,255,110,0.3)"
              : "rgba(255,61,46,0.3)",
            backgroundColor: isWhale
              ? "rgba(255,179,0,0.1)"
              : direction === "incoming"
              ? "rgba(57,255,110,0.08)"
              : "rgba(255,61,46,0.08)",
            color: isWhale
              ? "var(--amber)"
              : direction === "incoming"
              ? "var(--green)"
              : "var(--red)"
          }}
        >
          {badgeText}
        </span>
        {isWhale && (
          <span
            className="ml-auto inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] tracking-[0.2em] uppercase"
            style={{
              borderColor: "rgba(255,179,0,0.3)",
              backgroundColor: "rgba(255,179,0,0.1)",
              color: "var(--amber)"
            }}
          >
            ⚡ Alert
          </span>
        )}
        <span className="ml-auto text-[10px]" style={{ color: "var(--dim)" }}>
          {ago}
        </span>
      </div>
      <div
        className={`mb-1 font-bold ${ethBig ? "text-lg" : "text-base"}`}
        style={{
          fontFamily: "var(--font-orbitron)",
          color: ethBig ? "var(--amber)" : "var(--amber3)"
        }}
      >
        {eth.toFixed(4)} ETH{" "}
        <span
          className="text-[11px] font-normal"
          style={{ color: "var(--muted)" }}
        >
          ≈ {fmtUSD(eth)}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-3 text-[10px]">
        <div style={{ color: "var(--muted)" }}>
          FROM:{" "}
          <span style={{ color: "var(--text2)" }}>
            {truncAddr(tx.from_address)}
          </span>
        </div>
        <div style={{ color: "var(--muted)" }}>
          TO:{" "}
          <span style={{ color: "var(--text2)" }}>
            {truncAddr(tx.to_address)}
          </span>
        </div>
        {explorerHref && (
          <a
            href={explorerHref}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--amber2)" }}
          >
            → etherscan
          </a>
        )}
      </div>
    </article>
  );
}

function timeAgo(date: Date) {
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  return `${Math.floor(diffSeconds / 3600)}h ago`;
}

function truncAddr(addr: string | null) {
  if (!addr) return "";
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function fmtUSD(eth: number) {
  const usd = eth * 3200;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

