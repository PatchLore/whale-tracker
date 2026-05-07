import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ActivationRedirect } from "./ActivationRedirect";
import { WHOP_EXPERIENCE_SLUG } from "@/lib/config";

export default async function Home() {
  const requestHeaders = await headers();
  const whopUserToken = requestHeaders.get("x-whop-user-token");

  // If request is from Whop iframe, redirect to experience instead of showing landing page
  if (whopUserToken) {
    redirect(`/experiences/${WHOP_EXPERIENCE_SLUG}`);
  }

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#060501" }}
    >
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-5 pt-16 pb-20">
        <Suspense fallback={null}>
          <ActivationRedirect />
        </Suspense>
        <header className="mb-10">
          <h1
            className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
            style={{
              fontFamily: "var(--font-orbitron)",
              color: "var(--amber)",
              textShadow:
                "0 0 40px rgba(255,179,0,0.4), 0 0 80px rgba(255,179,0,0.15)"
            }}
          >
            Track whale wallets in real-time.
          </h1>
          <p
            className="mt-4 max-w-xl text-sm leading-relaxed"
            style={{ color: "var(--text2)" }}
          >
            WhaleNet watches the largest wallets on-chain and surfaces the moves
            that matter — with instant Telegram alerts and a clean, radar-style
            activity feed.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="/signup"
              className="rounded-md px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--amber), var(--amber2))",
                color: "var(--bg)",
                fontFamily: "var(--font-orbitron)"
              }}
            >
              Start Tracking Whales
            </a>
          </div>
        </header>

        <section className="mb-10 grid gap-5 md:grid-cols-3 text-sm">
          <div
            className="rounded-xl border px-4 py-4"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border2)"
            }}
          >
            <h2
              className="text-[11px] tracking-[0.3em] uppercase mb-3"
              style={{ color: "var(--amber2)", fontFamily: "var(--font-orbitron)" }}
            >
              Live Intelligence
            </h2>
              <ul className="space-y-2 text-[12px]" style={{ color: "var(--text2)" }}>
                <li>• Live polling of tracked wallets every 60 seconds</li>
                <li>• Directional context on every move (incoming vs outgoing)</li>
                <li>• Whale detection based on your custom ETH thresholds</li>
                <li>• Up to 10 wallets tracked simultaneously</li>
              </ul>
          </div>
          <div
            className="rounded-xl border px-4 py-4"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border2)"
            }}
          >
            <h2
              className="text-[11px] tracking-[0.3em] uppercase mb-3"
              style={{ color: "var(--amber2)", fontFamily: "var(--font-orbitron)" }}
            >
              Alerts That Cut Through Noise
            </h2>
            <ul className="space-y-2 text-[12px]" style={{ color: "var(--text2)" }}>
              <li>• Instant Telegram alerts as whale moves land on-chain</li>
              <li>• Clean, console-style feed tuned for attention</li>
              <li>• Per-wallet thresholds so you only get alerted on what matters</li>
            </ul>
          </div>
          <div
            className="rounded-xl border px-4 py-4"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border2)"
            }}
          >
             <h2
               className="text-[11px] tracking-[0.3em] uppercase mb-3"
               style={{ color: "var(--amber2)", fontFamily: "var(--font-orbitron)" }}
             >
               Supported Networks
             </h2>
              <ul className="space-y-2 text-[12px]" style={{ color: "var(--text2)" }}>
                <li>✅ Ethereum mainnet (full support)</li>
              </ul>
          </div>
        </section>

         <section className="mb-8 text-sm">
           <h2
             className="text-[11px] tracking-[0.3em] uppercase mb-3"
             style={{ color: "var(--amber2)", fontFamily: "var(--font-orbitron)" }}
           >
             Get Started
           </h2>
           <div className="max-w-md">
             <div
               className="rounded-xl border px-4 py-4"
               style={{
                 backgroundColor: "rgba(255,179,0,0.06)",
                 borderColor: "rgba(255,179,0,0.4)"
               }}
             >
               <div className="mb-3">
                 <span
                   className="text-xs tracking-[0.25em] uppercase"
                   style={{ color: "var(--amber)" }}
                 >
                   Available exclusively on Whop
                 </span>
               </div>
                <ul className="space-y-1 text-[12px]" style={{ color: "var(--text2)" }}>
                  <li>• Track up to 10 wallets</li>
                  <li>• Checks for new transactions every 60 seconds</li>
                  <li>• Intelligent whale detection with custom thresholds</li>
                  <li>• Instant Telegram alerts for large moves</li>
                  <li>• Clean real-time activity feed</li>
                </ul>
               <a
                 href="https://whop.com/whalenet"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="mt-4 inline-block rounded-md px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em]"
                 style={{
                   backgroundImage:
                     "linear-gradient(135deg, var(--amber), var(--amber2))",
                   color: "var(--bg)",
                   fontFamily: "var(--font-orbitron)"
                 }}
               >
                 View Pricing on Whop
               </a>
             </div>
           </div>
         </section>

        <footer className="mt-auto pt-4 text-[11px]" style={{ color: "var(--dim)" }}>
          Built for traders who care about on-chain flows more than headlines.
        </footer>
      </div>
    </main>
  );
}
