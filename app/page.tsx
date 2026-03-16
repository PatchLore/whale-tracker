export default function Home() {
  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#060501" }}
    >
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-5 pt-16 pb-20">
        <header className="mb-10">
          <div
            className="text-xs tracking-[0.35em] uppercase"
            style={{ color: "var(--muted)", fontFamily: "var(--font-plex-mono)" }}
          >
            {/* Whale Wallet Intelligence */}
          </div>
          <h1
            className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
            style={{
              fontFamily: "var(--font-orbitron)",
              color: "var(--amber)",
              textShadow:
                "0 0 40px rgba(255,179,0,0.4), 0 0 80px rgba(255,179,0,0.15)"
            }}
          >
            Track whale wallets
            <br />
            in real-time.
          </h1>
          <p
            className="mt-4 max-w-xl text-sm leading-relaxed"
            style={{ color: "var(--text2)" }}
          >
            WhaleNet watches the largest wallets on-chain and surfaces the moves
            that matter — with instant whale alerts, Telegram notifications and
            a clean, radar-style activity feed.
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
              Get Started
            </a>
            <span
              className="text-[11px]"
              style={{ color: "var(--dim)" }}
            >
              Free tier included · No card required
            </span>
          </div>
        </header>

        <section className="mb-10 grid gap-5 md:grid-cols-2 text-sm">
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
              <li>• Live polling of tracked wallets with whale-level thresholds.</li>
              <li>• Directional context on every move (incoming vs outgoing).</li>
              <li>• Whale detection based on your custom ETH thresholds.</li>
              <li>• Multi-chain support: Ethereum, BSC and Solana.</li>
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
              <li>• Telegram alerts for whale moves as they land on-chain.</li>
              <li>• Browser notifications for an instant local signal.</li>
              <li>• Clean, console-style feed tuned for attention.</li>
            </ul>
          </div>
        </section>

        <section className="mb-8 text-sm">
          <h2
            className="text-[11px] tracking-[0.3em] uppercase mb-3"
            style={{ color: "var(--amber2)", fontFamily: "var(--font-orbitron)" }}
          >
            Pricing
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div
              className="rounded-xl border px-4 py-4"
              style={{
                backgroundColor: "rgba(255,179,0,0.02)",
                borderColor: "var(--border2)"
              }}
            >
              <div className="flex items-baseline justify-between mb-2">
                <span
                  className="text-xs tracking-[0.25em] uppercase"
                  style={{ color: "var(--muted)" }}
                >
                  Free
                </span>
                <span
                  className="text-lg font-semibold"
                  style={{ color: "var(--amber3)" }}
                >
                  $0
                </span>
              </div>
              <ul className="space-y-1 text-[12px]" style={{ color: "var(--text2)" }}>
                <li>• Track up to 3 wallets</li>
                <li>• 60s polling interval</li>
                <li>• Whale detection & activity feed</li>
              </ul>
            </div>
            <div
              className="rounded-xl border px-4 py-4"
              style={{
                backgroundColor: "rgba(255,179,0,0.06)",
                borderColor: "rgba(255,179,0,0.4)"
              }}
            >
              <div className="flex items-baseline justify-between mb-2">
                <span
                  className="text-xs tracking-[0.25em] uppercase"
                  style={{ color: "var(--amber)" }}
                >
                  Pro
                </span>
                <span
                  className="text-lg font-semibold"
                  style={{ color: "var(--amber)" }}
                >
                  £9.99/mo — Limited Offer
                </span>
              </div>
              <ul className="space-y-1 text-[12px]" style={{ color: "var(--text2)" }}>
                <li>• Track up to 50 wallets</li>
                <li>• Faster polling interval (30s)</li>
                <li>• Telegram whale alerts</li>
              </ul>
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
