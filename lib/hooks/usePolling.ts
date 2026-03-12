"use client";

import { useEffect, useRef } from "react";
import type { Tier, Wallet, Transaction } from "@/types/supabase";

type UsePollingOptions = {
  tier: Tier;
  wallets: Wallet[];
  telegramChatId: string | null;
  onNewTransactions: (walletId: string, txs: Transaction[]) => void;
};

type PollResponse = {
  newTxns: number;
  whaleAlerts: Transaction[];
  transactions: Transaction[];
};

export function usePolling({
  tier,
  wallets,
  telegramChatId,
  onNewTransactions
}: UsePollingOptions) {
  const timersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const intervalMs = tier === "pro" ? 30_000 : 60_000;

    const activeWallets = wallets.filter(w => w.is_active);

    const firePoll = async (wallet: Wallet) => {
      try {
        const payload = {
          walletId: wallet.id,
          address: wallet.address,
          chain: wallet.chain,
          threshold: wallet.threshold ?? 0,
          userId: wallet.user_id
        };

        const res = await fetch("/api/poll", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) return;

        const data = (await res.json()) as PollResponse;
        if (data.transactions?.length) {
          onNewTransactions(wallet.id, data.transactions);
        }

        if (data.whaleAlerts?.length) {
          // Telegram alerts
          if (telegramChatId) {
            for (const tx of data.whaleAlerts) {
              const direction =
                tx.direction === "incoming" ? "received" : "sent";
              const eth = tx.eth_value ?? 0;
              const usdApprox = (eth * 3200).toFixed(0);
              const messageLines = [
                "🐋 WHALE ALERT",
                `${direction.toUpperCase()} ${eth.toFixed(
                  2
                )} ETH (≈$${usdApprox})`,
                `From: ${tx.from_address ?? "-"}`,
                `To: ${tx.to_address ?? "-"}`,
                tx.hash.startsWith("0x")
                  ? `→ https://etherscan.io/tx/${tx.hash}`
                  : ""
              ].filter(Boolean);

              void fetch("/api/alerts/telegram", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chatId: telegramChatId,
                  message: messageLines.join("\n")
                })
              });
            }
          }

          // Browser notification fallback
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              data.whaleAlerts.forEach(tx => {
                const eth = tx.eth_value ?? 0;
                const direction =
                  tx.direction === "incoming" ? "received" : "sent";
                new Notification("🐋 WhaleNet Alert", {
                  body: `${direction} ${eth.toFixed(2)} ETH`,
                  tag: tx.id
                });
              });
            }
          }
        }
      } catch {
        // Swallow polling errors; they should not break the dashboard.
      }
    };

    activeWallets.forEach(wallet => {
      // Initial fire
      void firePoll(wallet);

      const timerId = window.setInterval(() => {
        void firePoll(wallet);
      }, intervalMs);

      timersRef.current[wallet.id] = timerId;
    });

    return () => {
      Object.values(timersRef.current).forEach(id => window.clearInterval(id));
      timersRef.current = {};
    };
  }, [tier, wallets, telegramChatId, onNewTransactions]);
}


