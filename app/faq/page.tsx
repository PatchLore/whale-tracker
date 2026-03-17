export const dynamic = "force-dynamic";

const faqs = [
  {
    id: "access",
    question: "How do I get access to WhaleNet?",
    answer: (
      <p className="text-sm text-[var(--text2)]">
        Purchase your subscription at{" "}
        <a
          href="https://whop.com/whalenet/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
          style={{ color: "var(--amber2)" }}
        >
          whop.com/whalenet
        </a>{" "}
        — once payment is confirmed you&apos;ll be redirected to create your account
        and get started instantly. Your Pro access is activated automatically.
      </p>
    )
  },
  {
    id: "activation-delay",
    question: "I've paid on Whop but my account isn't activated yet — what do I do?",
    answer: (
      <p className="text-sm text-[var(--text2)]">
        After payment you&apos;ll be redirected to the app automatically. If your
        access hasn&apos;t activated within 30 seconds, try logging out and back in.
        If the issue persists, contact us via Whop and we&apos;ll sort it within a
        few hours.
      </p>
    )
  },
  {
    id: "telegram",
    question: "How do I get my Telegram Chat ID?",
    answer: (
      <>
        <p className="mb-2">
          To connect Telegram, you need your numeric chat ID. Follow these steps:
        </p>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-[var(--text2)]">
          <li>Open Telegram and use the search bar to find <code>@userinfobot</code>.</li>
          <li>Start a chat with the bot and press <strong>Start</strong>.</li>
          <li>The bot will reply with your user information, including a line labeled <strong>Your chat ID</strong>.</li>
          <li>Copy that numeric ID and paste it into the Telegram Chat ID field in your WhaleNet dashboard.</li>
        </ol>
      </>
    )
  },
  {
    id: "whale-alert",
    question: "What is a whale alert?",
    answer: (
      <p className="text-sm text-[var(--text2)]">
        A whale alert is a notification triggered when a tracked wallet moves at least your configured
        ETH threshold in a single transaction. WhaleNet flags these large moves in the activity feed and,
        if enabled, sends them to your Telegram.
      </p>
    )
  },
  {
    id: "free-vs-pro",
    question: "What's the difference between free and pro?",
    answer: (
      <p className="text-sm text-[var(--text2)]">
        WhaleNet is currently operating a single Pro plan while we roll out the product.
        All authenticated users get the full feature set: up to 50 wallets, 30s polling,
        whale detection, and instant Telegram alerts.
      </p>
    )
  },
  {
    id: "wallets",
    question: "Which wallets can I track?",
    answer: (
      <p className="text-sm text-[var(--text2)]">
        You can track any public blockchain address that is compatible with the chains WhaleNet supports.
        Today the dashboard focuses on Ethereum addresses (0x… format). As additional chains are enabled,
        they&apos;ll appear in the wallet registry chain selector.
      </p>
    )
  },
  {
    id: "cancel",
    question: "How do I cancel my subscription?",
    answer: (
      <p className="text-sm text-[var(--text2)]">
        You can cancel your Pro subscription at any time from your billing portal or payment email.
        Once cancelled, your access will continue until the end of the current billing period, after which
        billing stops and new alerts will no longer be delivered.
      </p>
    )
  }
];

export default function FaqPage() {
  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#060501" }}
    >
      <div className="relative z-10 mx-auto max-w-3xl px-5 pt-16 pb-20">
        <header className="mb-10">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.35em] uppercase"
            style={{
              fontFamily: "var(--font-orbitron)",
              color: "var(--amber)",
              textShadow:
                "0 0 40px rgba(255,179,0,0.4), 0 0 80px rgba(255,179,0,0.15)"
            }}
          >
            WHALENET FAQ
          </h1>
          <p
            className="mt-4 text-xs tracking-[0.3em] uppercase"
            style={{ color: "var(--muted)", fontFamily: "var(--font-plex-mono)" }}
          >
            Common questions about setup &amp; alerts
          </p>
        </header>

        <section
          className="space-y-6 rounded-xl border px-5 py-5"
          style={{ borderColor: "var(--border2)", backgroundColor: "var(--surface)" }}
        >
          {faqs.map(item => (
            <div key={item.id} id={item.id} className="space-y-2">
              <h2
                className="text-sm tracking-[0.25em] uppercase"
                style={{ fontFamily: "var(--font-orbitron)", color: "var(--amber2)" }}
              >
                {item.question}
              </h2>
              {item.answer}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

