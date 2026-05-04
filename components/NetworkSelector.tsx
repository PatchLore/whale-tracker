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
        className="mb-1 block text-[11px] tracking-[0.3em] uppercase text-slate-600 dark:text-slate-500"
      >
        Network
      </label>
      <select
        id="network-selector"
        value={value}
        onChange={e => onChange(e.target.value as WalletChain)}
        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 network-select"
      >
        {NETWORK_OPTIONS.map(option => (
          <option
            key={option.chain}
            value={option.chain}
            disabled={!option.available}
            className={option.available ? undefined : "coming-soon-badge"}
            style={{ color: option.available ? undefined : "#94a3b8" }}
          >
            {option.label}
            {option.available ? "" : " — soon"}
          </option>
        ))}
      </select>
      <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
        Only Ethereum is currently supported.
      </p>
    </div>
  );
}
