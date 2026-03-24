export type WalletChain = "ethereum" | "bsc" | "solana";

export interface Profile {
  id: string;
  email: string | null;
  tier?: string | null; // Deprecated: kept for backward compatibility
  whop_user_id: string | null; // Whop user ID mapping for access control
  telegram_chat_id: string | null;
  default_threshold: number | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  label: string | null;
  address: string;
  chain: WalletChain;
  threshold: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  hash: string;
  direction: "incoming" | "outgoing";
  eth_value: number | null;
  from_address: string | null;
  to_address: string | null;
  block_timestamp: number | null;
  is_whale: boolean | null;
  created_at: string;
}
