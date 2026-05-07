"use client";

import { useEffect, useRef, useState } from "react";
import type { Wallet, Transaction } from "@/types/supabase";

type UsePollingOptions = {
  wallets: Wallet[];
  isReady: boolean;
  telegramChatId: string | null;
  onNewTransactions: (walletId: string, txs: Transaction[]) => void;
};

type PollResponse = {
  newTxns: number;
  whaleAlerts: Transaction[];
  transactions: Transaction[];
};

export function usePolling({
  wallets,
  isReady,
  telegramChatId,
  onNewTransactions
}: UsePollingOptions) {
  const timersRef = useRef<Record<string, number>>({});
  const [isPollingError, setIsPollingError] = useState(false);
  const failureCountRef = useRef(0);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document !== "undefined") {
      return !document.hidden;
    }
    return true;
  });

  // Track page visibility changes
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const intervalMs = 60_000; // All users get pro polling (60s to reduce API load)

    const activeWallets = wallets.filter(w => w.is_active);

    if (activeWallets.length === 0) {
      return;
    }

    // Don't start polling if tab is hidden
    if (!isVisible) {
      return;
    }

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
        if (!res.ok) {
          failureCountRef.current += 1;
          if (failureCountRef.current > 3) {
            setIsPollingError(true);
          }
          return;
        }

        const data = (await res.json()) as PollResponse;

        // Successful poll: reset error state and failure counter.
        failureCountRef.current = 0;
        if (isPollingError) {
          setIsPollingError(false);
        }

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
      } catch (err) {
        // Log polling errors for debugging; UI stays resilient.
        // eslint-disable-next-line no-console
        console.error("[polling] error", err);
        failureCountRef.current += 1;
        if (failureCountRef.current > 3) {
          setIsPollingError(true);
        }
      }
    };

    activeWallets.forEach(wallet => {
      // Initial fire
      void firePoll(wallet);

      const timerId = window.setInterval(() => {
        if (!document.hidden) {
          void firePoll(wallet);
        }
      }, intervalMs);

      timersRef.current[wallet.id] = timerId;
    });

    return () => {
      Object.values(timersRef.current).forEach(id => window.clearInterval(id));
      timersRef.current = {};
    };
  }, [wallets, isReady, telegramChatId, onNewTransactions, isPollingError, isVisible]);

  return { isPollingError };
}

