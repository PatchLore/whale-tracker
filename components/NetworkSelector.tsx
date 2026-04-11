"use client";

import type { WalletChain } from "@/types/supabase";

type NetworkOption = {
  chain: WalletChain;
  label: string;
  available: boolean;
  note: string;
};

const NETWORK_OPTIONS: NetworkOption[] = [
  {
    chain: "ethereum",
    label: "Ethereum (ETH)",
    available: true,
    note: "Available now"
  },
  {
    chain: "bsc",
    label: "BNB Chain (BSC)",
    available: false,
    note: "Coming soon"
  },
  {
    chain: "solana",
    label: "Solana (SOL)",
    available: false,
    note: "Coming soon"
  }
];

type Props = {
  value: WalletChain;
  onChange: (chain: WalletChain) => void;
};

export function NetworkSelector({ value, onChange }: Props) {
  return (
    <div>
      <label
        htmlFor="network-selector"
        className="mb-1 block text-[9px] tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500"
      >
        Network
      </label>
      <select
        id="network-selector"
        value={value}
        onChange={e => onChange(e.target.value as WalletChain)}
        className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-300/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      >
        {NETWORK_OPTIONS.map(option => (
          <option key={option.chain} value={option.chain} disabled={!option.available}>
            {option.label} {option.available ? "" : "— coming soon"}
          </option>
        ))}
      </select>
      <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
        Select Ethereum to track wallets now. BSC and Solana are displayed here so users know they are coming soon.
      </p>
    </div>
  );
}
