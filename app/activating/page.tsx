"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useActivationCheck } from "@/lib/hooks/useActivationCheck";
import { WHOP_STORE_URL } from "@/lib/config";

export default function ActivatingPage() {
  const { activated, timeout } = useActivationCheck(true);
  const router = useRouter();

  useEffect(() => {
    if (activated) {
      router.replace("/dashboard");
    }
  }, [activated, router]);

  const showTimeout = timeout && !activated;

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#060501" }}
    >
      <div className="w-full max-w-md text-center">
        <div className="flex flex-col items-center gap-4 rounded-xl border px-6 py-8"
          style={{
            borderColor: "var(--border2)",
            backgroundColor: "rgba(0,0,0,0.7)"
          }}
        >
          <div className="inline-flex items-center justify-center">
            <span
              className="h-4 w-4 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--green)" }}
            />
          </div>
          <h1
            className="text-xl sm:text-2xl tracking-[0.25em] uppercase text-amber-400"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            Activating your account...
          </h1>
          <p className="mt-2 text-xs text-neutral-300 tracking-[0.15em] uppercase">
            This usually takes a few seconds.
          </p>

          {showTimeout && (
            <div className="mt-6 space-y-3 text-sm text-neutral-300">
              <p className="font-semibold">Taking longer than expected.</p>
              <p className="text-xs text-neutral-400">
                If you&apos;ve just paid, please wait a moment and refresh. If the issue
                persists, contact support.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href="/dashboard"
                  className="w-full rounded-md border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{
                    borderColor: "rgba(255,179,0,0.6)",
                    color: "var(--amber3)",
                    fontFamily: "var(--font-orbitron)"
                  }}
                >
                  Try Dashboard
                </a>
                <a
                  href={WHOP_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full rounded-md border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{
                    borderColor: "var(--border2)",
                    color: "var(--muted)",
                    fontFamily: "var(--font-orbitron)"
                  }}
                >
                  Back to Whop
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

