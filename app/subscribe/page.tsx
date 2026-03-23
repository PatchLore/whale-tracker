import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SubscribePage() {
  const requestHeaders = await headers();
  const whopUserToken = requestHeaders.get("x-whop-user-token");

  // If request is from Whop iframe, redirect to experience instead of showing subscribe page
  if (whopUserToken) {
    redirect("/experiences/whalenet-2e");
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#060501" }}
    >
      <div className="w-full max-w-md rounded-xl border px-6 py-8 shadow-[0_0_40px_rgba(255,179,0,0.15)]"
        style={{ borderColor: "var(--border2)", backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        <header className="mb-6 text-center">
          <h1
            className="text-2xl sm:text-3xl tracking-[0.35em] uppercase text-amber-400"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            Get WhaleNet Pro
          </h1>
          <p className="mt-3 text-xs text-neutral-300 tracking-[0.2em] uppercase">
            Track up to 50 wallets with instant Telegram alerts.
          </p>
        </header>

        <div className="mt-4 text-sm text-neutral-300 space-y-3">
          <p>
            WhaleNet watches the largest wallets on-chain and surfaces the moves that matter,
            with a radar-style activity feed and pro-grade alerting.
          </p>
        </div>

        <a
          href="https://whop.com/whalenet-2e/"
          target="_blank"
          rel="noreferrer"
          className="mt-8 block w-full rounded-md border px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] transition"
          style={{
            borderColor: "rgba(255,179,0,0.6)",
            backgroundImage: "linear-gradient(135deg, var(--amber), var(--amber2))",
            color: "var(--bg)",
            fontFamily: "var(--font-orbitron)"
          }}
        >
          Subscribe on Whop — £9.99/mo
        </a>
      </div>
    </main>
  );
}

