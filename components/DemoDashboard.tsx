"use client";

import { useState, useEffect, useMemo } from "react";
import { WalletChain } from "@/types/supabase";

// Mock data for preview/demo mode
const MOCK_WALLETS = [
  {
    id: "demo-wallet-1",
    user_id: "demo-user",
    label: "Justin Sun Wallet",
    address: "0x3d7f5b2b1b2b4b3c3d4d5e6f7a8b9c0d1e2f3a4b",
    chain: "ethereum" as WalletChain,
    threshold: 10,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "demo-wallet-2",
    user_id: "demo-user",
    label: "Vitalik Buterin",
    address: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    chain: "ethereum" as WalletChain,
    threshold: 50,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "demo-wallet-3",
    user_id: "demo-user",
    label: "Binance Cold Wallet",
    address: "0x28C6c06298d514Db089934071355E5743bf21d60",
    chain: "ethereum" as WalletChain,
    threshold: 100,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "demo-wallet-4",
    user_id: "demo-user",
    label: "Whale Tracker",
    address: "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8",
    chain: "ethereum" as WalletChain,
    threshold: 25,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "demo-wallet-5",
    user_id: "demo-user",
    label: "Sample Wallet",
    address: "0x2f2b40c7B5cE2e4bE4e5C5f6a7b8c9d0e1f2a3b4c",
    chain: "ethereum" as WalletChain,
    threshold: 5,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

const MOCK_TRANSACTIONS = [
  {
    id: "demo-tx-1",
    wallet_id: "demo-wallet-1",
    hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    direction: "outgoing" as const,
    eth_value: 150.5,
    from_address: "0x3d7f5b2b1b2b4b3c3d4d5e6f7a8b9c0d1e2f3a4b",
    to_address: "0x4e8b4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
    block_timestamp: Math.floor(Date.now() / 1000) - 300,
    is_whale: true,
    created_at: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: "demo-tx-2",
    wallet_id: "demo-wallet-2",
    hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    direction: "incoming" as const,
    eth_value: 75.25,
    from_address: "0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5",
    to_address: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    block_timestamp: Math.floor(Date.now() / 1000) - 1200,
    is_whale: true,
    created_at: new Date(Date.now() - 1200000).toISOString()
  },
  {
    id: "demo-tx-3",
    wallet_id: "demo-wallet-3",
    hash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
    direction: "outgoing" as const,
    eth_value: 250.0,
    from_address: "0x28C6c06298d514Db089934071355E5743bf21d60",
    to_address: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    block_timestamp: Math.floor(Date.now() / 1000) - 3600,
    is_whale: true,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "demo-tx-4",
    wallet_id: "demo-wallet-4",
    hash: "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
    direction: "incoming" as const,
    eth_value: 12.75,
    from_address: "0x6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6",
    to_address: "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8",
    block_timestamp: Math.floor(Date.now() / 1000) - 7200,
    is_whale: false,
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: "demo-tx-5",
    wallet_id: "demo-wallet-5",
    hash: "0x1111111111111111111111111111111111111111111111111111111111111111",
    direction: "outgoing" as const,
    eth_value: 500.0,
    from_address: "0x2f2b40c7B5cE2e4bE4e5C5f6a7b8c9d0e1f2a3b4c",
    to_address: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7",
    block_timestamp: Math.floor(Date.now() / 1000) - 10800,
    is_whale: true,
    created_at: new Date(Date.now() - 10800000).toISOString()
  },
  {
    id: "demo-tx-6",
    wallet_id: "demo-wallet-1",
    hash: "0x2222222222222222222222222222222222222222222222222222222222222222",
    direction: "incoming" as const,
    eth_value: 33.33,
    from_address: "0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8",
    to_address: "0x3d7f5b2b1b2b4b3c3d4d5e6f7a8b9c0d1e2f3a4b",
    block_timestamp: Math.floor(Date.now() / 1000) - 18000,
    is_whale: false,
    created_at: new Date(Date.now() - 18000000).toISOString()
  }
];

type MockWallet = typeof MOCK_WALLETS[0];
type MockTransaction = typeof MOCK_TRANSACTIONS[0];

export function DemoDashboard() {
  const wallets = MOCK_WALLETS;
  const transactions = MOCK_TRANSACTIONS.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const stats = {
    txCount: transactions.length,
    whaleAlerts: transactions.filter(t => t.is_whale).length,
    largestMove: Math.max(...transactions.map(t => t.eth_value ?? 0))
  };

  const walletLimit = 50;
  const telegramChatId = null;

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-5 pt-7 pb-20">
      <Header isDemoMode />

      <div
        className="mb-4 rounded-lg border px-4 py-3 text-[10px]"
        style={{
          borderColor: "rgba(255,179,0,0.25)",
          backgroundColor: "rgba(255,179,0,0.05)",
          color: "var(--amber2)",
          fontFamily: "var(--font-plex-mono)"
        }}
      >
        <div className="text-[11px]" style={{ color: "var(--text2)" }}>
          🎬 DEMO MODE — This is a preview of the app with sample data for reviewers
        </div>
      </div>

      <StatsBar
        walletCount={wallets.length}
        txCount={stats.txCount}
        whaleAlerts={stats.whaleAlerts}
        largestMove={stats.largestMove}
      />

      <div className="grid gap-4 md:grid-cols-[340px,1fr]">
        <div>
          <WalletRegistry
            walletLimit={walletLimit}
            walletCount={wallets.length}
            wallets={wallets}
            isLoading={false}
            userId="demo-user"
            telegramChatId={telegramChatId}
            onTelegramChatIdChange={() => {}}
            defaultThreshold={10}
            isDemoMode={true}
          />
        </div>
        <div>
          <ActivityFeed
            transactions={transactions}
            totalCount={transactions.length}
            filter="all"
            onFilterChange={() => {}}
            hasWallets={wallets.length > 0}
            isDemoMode={true}
          />
        </div>
      </div>

      <DemoModeBanner />
    </div>
  );
}

function Header({ isDemoMode = false }: { isDemoMode?: boolean }) {
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
          REAL-TIME WALLET INTELLIGENCE · TRACK · ALERT · FOLLOW
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 text-[10px]">
        <div className="inline-flex items-center gap-2 rounded border border-[rgba(57,255,110,0.3)] bg-[rgba(57,255,110,0.08)] px-3 py-1 tracking-[0.3em] text-[10px] uppercase text-[var(--green)]">
          <span className="h-[7px] w-[7px] rounded-full bg-[var(--green)] animate-pulse" />
          DEMO MODE
        </div>
      </div>
    </header>
  );
}

function DemoModeBanner() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t px-4 py-3 text-center text-[10px]"
      style={{
        borderColor: "rgba(255,179,0,0.3)",
        backgroundColor: "rgba(255,179,0,0.08)",
        color: "var(--amber2)",
        fontFamily: "var(--font-plex-mono)"
      }}
    >
      <strong>PREVIEW MODE</strong> — This is a demonstration with mock data. In production, you would see your actual tracked wallets and real transactions.
    </div>
  );
}

function StatsBar({
  walletCount,
  txCount,
  whaleAlerts,
  largestMove
}: {
  walletCount: number;
  txCount: number;
  whaleAlerts: number;
  largestMove: number;
}) {
  const walletLimit = 50;
  const pollInterval = "30s (simulated)";

  return (
    <section
      className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-px overflow-hidden rounded-lg border border-[var(--border)]"
      style={{ backgroundColor: "var(--border)" }}
    >
      <StatCell
        label="WALLETS TRACKED"
        value={walletCount.toString()}
        sub={`of ${walletLimit}`}
      />
      <StatCell
        label="TRANSACTIONS SEEN"
        value={txCount.toString()}
        sub="demo data"
      />
      <StatCell
        label="WHALE ALERTS"
        value={whaleAlerts.toString()}
        sub="above threshold"
        valueColor="var(--amber)"
      />
      <StatCell
        label="LARGEST MOVE"
        value={`${largestMove.toFixed(1)} ETH`}
        sub="demo data"
      />
      <StatCell
        label="POLL INTERVAL"
        value={pollInterval}
        sub="simulated"
      />
    </section>
  );
}

function StatCell({
  label,
  value,
  sub,
  valueColor
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}) {
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
  walletLimit: number;
  walletCount: number;
  wallets: MockWallet[];
  isLoading: boolean;
  userId: string;
  telegramChatId: string | null;
  onTelegramChatIdChange: (value: string | null) => void;
  defaultThreshold: number | null;
  isDemoMode: boolean;
};

function WalletRegistry({
  walletLimit,
  walletCount,
  wallets,
  isLoading,
  userId,
  telegramChatId,
  onTelegramChatIdChange,
  defaultThreshold,
  isDemoMode
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
        {isDemoMode ? (
          <div
            className="mb-4 rounded border border-dashed px-4 py-3 text-center text-[10px]"
            style={{
              borderColor: "rgba(255,179,0,0.3)",
              backgroundColor: "rgba(255,179,0,0.05)",
              color: "var(--amber2)"
            }}
          >
            <strong>Demo Mode</strong> — Wallet management is disabled. In production, you can add and remove wallets here.
          </div>
        ) : (
          <AddWalletForm
            disabled={walletCount >= walletLimit}
            onSubmit={() => {}}
            defaultThreshold={defaultThreshold}
          />
        )}

        <div className="mt-4 space-y-2">
          {wallets.map(w => (
            <WalletCard
              key={w.id}
              wallet={w}
              onUpdateThreshold={() => {}}
              onRemove={() => {}}
              isDemoMode={isDemoMode}
            />
          ))}
        </div>

        <TelegramSettings
          userId={userId}
          value={telegramChatId}
          onChange={onTelegramChatIdChange}
          isDemoMode={isDemoMode}
        />
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
  const [threshold, setThreshold] = useState((defaultThreshold ?? 10).toString());
  const [chain, setChain] = useState<WalletChain>("ethereum");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setThreshold((defaultThreshold ?? 10).toString());
  }, [defaultThreshold]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          disabled
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
          disabled
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
            disabled
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
            {(["ethereum", "bsc", "solana"] as WalletChain[]).map(option => {
              const isEth = option === "ethereum";
              const isActive = chain === option;
              const disabled = !isEth;

              return (
                <button
                  key={option}
                  type="button"
                  disabled
                  className="rounded border px-3 py-1 text-[9px] tracking-[0.2em] uppercase transition"
                  style={{
                    borderColor: isActive ? "var(--amber2)" : "var(--border)",
                    backgroundColor: isActive
                      ? "rgba(255,140,0,0.08)"
                      : "transparent",
                    color: disabled
                      ? "var(--muted)"
                      : isActive
                      ? "var(--amber2)"
                      : "var(--muted)",
                    fontFamily: "var(--font-plex-mono)",
                    opacity: disabled ? 0.4 : 1,
                    cursor: "not-allowed"
                  }}
                >
                  {option === "ethereum"
                    ? "ETH"
                    : option === "bsc"
                    ? "BSC"
                    : "SOL"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={true}
        className="mt-1 w-full rounded border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.25em] transition"
        style={{
          borderColor: "rgba(255,179,0,0.4)",
          backgroundColor: "rgba(255,179,0,0.1)",
          color: "var(--amber)",
          fontFamily: "var(--font-orbitron)",
          opacity: 0.6,
          cursor: "not-allowed"
        }}
      >
        + Add Wallet (Demo)
      </button>
    </form>
  );
}

type WalletCardProps = {
  wallet: MockWallet;
  onUpdateThreshold: (newThreshold: number) => void;
  onRemove: () => void;
  isDemoMode: boolean;
};

function WalletCard({ wallet, onUpdateThreshold, onRemove, isDemoMode }: WalletCardProps) {
  const [thresholdInput, setThresholdInput] = useState(
    wallet.threshold != null ? wallet.threshold.toString() : ""
  );

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
        {!isDemoMode && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 rounded border"
            style={{
              borderColor: "var(--red)",
              color: "var(--red)",
              backgroundColor: "transparent",
              fontFamily: "var(--font-plex-mono)"
            }}
          >
            Remove
          </button>
        )}
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
          <div className="flex items-center gap-2" style={{ color: "var(--amber)" }}>
            <input
              type="number"
              className="w-20 rounded border px-2 py-0.5 text-[10px]"
              style={{
                backgroundColor: "transparent",
                borderColor: "var(--border2)",
                color: "var(--amber3)",
                fontFamily: "var(--font-plex-mono)"
              }}
              value={thresholdInput}
              onChange={e => setThresholdInput(e.target.value)}
              disabled
            />
            <span>ETH</span>
            {!isDemoMode && (
              <button
                type="button"
                onClick={() => onUpdateThreshold(Number(thresholdInput))}
                className="rounded border px-2 py-0.5 text-[9px] uppercase tracking-[0.15em]"
                style={{
                  borderColor: "var(--border2)",
                  color: "var(--amber3)",
                  fontFamily: "var(--font-plex-mono)"
                }}
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type TelegramSettingsProps = {
  userId: string;
  value: string | null;
  onChange: (value: string | null) => void;
  isDemoMode: boolean;
};

function TelegramSettings({ userId, value, onChange, isDemoMode }: TelegramSettingsProps) {
  const [input, setInput] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [hasSavedId, setHasSavedId] = useState(Boolean(value));

  useEffect(() => {
    setHasSavedId(Boolean(value));
  }, [value]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) return;
  };

  return (
    <form onSubmit={handleSave} className="mt-4 space-y-1 text-[10px]">
      <div
        className="text-[9px] tracking-[0.2em] uppercase"
        style={{ color: "var(--muted)" }}
      >
        TELEGRAM CHAT ID{" "}
        <a
          href="/faq#telegram"
          target="_blank"
          rel="noreferrer"
          className="ml-1 text-[10px] align-middle underline underline-offset-2"
          style={{ color: "var(--amber2)" }}
        >
          ?
        </a>{" "}
        {hasSavedId && (
          <span
            className="inline-block h-2 w-2 rounded-full align-middle"
            style={{ backgroundColor: "var(--green)" }}
          />
        )}
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
        disabled={isDemoMode}
      />
      <p style={{ color: "var(--dim)" }}>
        Whale alerts will be pushed to this Telegram chat when enabled.
      </p>
      <button
        type="submit"
        disabled={saving || isDemoMode}
        className="mt-1 rounded border px-3 py-1 text-[10px] tracking-[0.2em] uppercase"
        style={{
          borderColor: "rgba(255,179,0,0.4)",
          backgroundColor: "rgba(255,179,0,0.06)",
          color: "var(--amber)",
          fontFamily: "var(--font-orbitron)",
          opacity: saving || isDemoMode ? 0.7 : 1
        }}
      >
        {isDemoMode
          ? "Demo Mode"
          : status === "saving"
          ? "Saving…"
          : status === "saved"
          ? "Saved ✓"
          : "Save Telegram ID"}
      </button>
    </form>
  );
}

type ActivityFeedProps = {
  transactions: MockTransaction[];
  totalCount: number;
  filter: "all" | "whale" | "incoming" | "outgoing";
  onFilterChange: (f: "all" | "whale" | "incoming" | "outgoing") => void;
  hasWallets: boolean;
  isDemoMode: boolean;
};

function ActivityFeed({
  transactions,
  totalCount,
  filter,
  onFilterChange,
  hasWallets,
  isDemoMode
}: ActivityFeedProps) {
  const [showDust, setShowDust] = useState(false);

  const DUST_THRESHOLD = 0.000001;

  const visibleTransactions = useMemo(
    () =>
      showDust
        ? transactions
        : transactions.filter(tx => (tx.eth_value ?? 0) >= DUST_THRESHOLD),
    [transactions, showDust]
  );

  const countLabel =
    visibleTransactions.length === 1
      ? "1 event"
      : `${visibleTransactions.length.toString()} events`;

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
            Demo Data
          </span>
        </div>
      </header>
      <div className="flex flex-1 flex-col px-4 py-3">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[9px]">
          <FeedFilterButton
            label="ALL"
            active={filter === "all"}
            onClick={() => onFilterChange("all")}
            disabled={isDemoMode}
          />
          <FeedFilterButton
            label="🐋 WHALE"
            active={filter === "whale"}
            onClick={() => onFilterChange("whale")}
            disabled={isDemoMode}
          />
          <FeedFilterButton
            label="INCOMING"
            active={filter === "incoming"}
            onClick={() => onFilterChange("incoming")}
            disabled={isDemoMode}
          />
          <FeedFilterButton
            label="OUTGOING"
            active={filter === "outgoing"}
            onClick={() => onFilterChange("outgoing")}
            disabled={isDemoMode}
          />
          <button
            type="button"
            onClick={() => setShowDust(prev => !prev)}
            className="ml-2 rounded border px-3 py-1 text-[9px] tracking-[0.2em] uppercase transition"
            style={{
              borderColor: showDust ? "var(--amber2)" : "var(--border)",
              backgroundColor: showDust ? "rgba(255,140,0,0.08)" : "transparent",
              color: showDust ? "var(--amber2)" : "var(--muted)",
              fontFamily: "var(--font-plex-mono)"
            }}
          >
            {showDust ? "HIDE DUST" : "SHOW DUST"}
          </button>
          <span
            className="ml-auto text-[10px]"
            style={{ color: "var(--dim)" }}
          >
            {countLabel}
          </span>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto pb-2">
          {visibleTransactions.length === 0 ? (
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
            visibleTransactions.slice(0, 50).map(tx => (
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
  disabled: boolean;
};

function FeedFilterButton({ label, active, onClick, disabled }: FeedFilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded border px-3 py-1 text-[9px] tracking-[0.2em] uppercase transition"
      style={{
        borderColor: active ? "var(--amber2)" : "var(--border)",
        backgroundColor: active ? "rgba(255,140,0,0.08)" : "transparent",
        color: disabled ? "var(--muted)" : active ? "var(--amber2)" : "var(--muted)",
        fontFamily: "var(--font-plex-mono)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer"
      }}
    >
      {label}
    </button>
  );
}

type TxCardProps = {
  tx: MockTransaction;
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
        {eth.toFixed(eth < 1 ? 6 : 4)} ETH{" "}
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
  if (diffSeconds < 48 * 3600) {
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  }
  const days = Math.floor(diffSeconds / (24 * 3600));
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
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