'use client';

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const dynamic = 'force-dynamic';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      setError("Supabase is not configured.");
      // eslint-disable-next-line no-console
      console.error("[login] Supabase client is null. Check env vars.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      // Small delay to allow auth cookies to be fully written before navigating.
      await new Promise(resolve => setTimeout(resolve, 500));
      // Use a full-page navigation so middleware sees the new session cookies.
      if (typeof window !== "undefined") {
        window.location.href = redirectTo;
      } else {
        router.push(redirectTo);
      }
    } else {
      setMessage("Check your email to confirm your login.");
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      setError("Supabase is not configured.");
      return;
    }

    const redirectBase = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const emailRedirectTo = `${redirectBase}/auth/callback?redirect=${encodeURIComponent(
      redirectTo
    )}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo
      }
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Magic link sent. Check your email.");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-amber-500/40 bg-black/40 backdrop-blur-sm rounded-xl p-8 shadow-[0_0_40px_rgba(255,179,0,0.15)]">
        <header className="mb-8 text-center">
          <h1
            className="text-3xl tracking-[0.35em] text-amber-400 uppercase"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            WHALENET
          </h1>
          <p className="mt-3 text-xs text-neutral-400 uppercase tracking-[0.25em]">
            Secure Portal
          </p>
        </header>

        <div className="mb-4 flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`flex-1 border px-3 py-2 rounded-md transition ${
              mode === "password"
                ? "border-amber-400 bg-amber-400/10 text-amber-200"
                : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMode("magic")}
            className={`flex-1 border px-3 py-2 rounded-md transition ${
              mode === "magic"
                ? "border-amber-400 bg-amber-400/10 text-amber-200"
                : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
            }`}
          >
            Magic Link
          </button>
        </div>

        <form
          onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}
          className="space-y-4 text-sm"
        >
          <div className="space-y-1">
            <label className="block text-xs uppercase tracking-[0.2em] text-neutral-400">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-black/60 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/60"
            />
          </div>

          {mode === "password" && (
            <div className="space-y-1">
              <label className="block text-xs uppercase tracking-[0.2em] text-neutral-400">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-black/60 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/60"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md border border-amber-500 bg-amber-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-amber-200 hover:bg-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading
              ? "Processing..."
              : mode === "password"
              ? "Sign In"
              : "Send Magic Link"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-xs text-red-400 border border-red-500/40 bg-red-900/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {message && !error && (
          <p className="mt-4 text-xs text-amber-200 border border-amber-500/40 bg-amber-900/10 rounded-md px-3 py-2">
            {message}
          </p>
        )}

        <footer className="mt-6 text-center text-xs text-neutral-500">
          <span className="mr-1">No account?</span>
          <a
            href={`/signup?redirect=${encodeURIComponent(redirectTo)}`}
            className="text-amber-300 hover:text-amber-200 underline underline-offset-4"
          >
            Create one
          </a>
        </footer>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ background: "#060501", minHeight: "100vh" }} />
      }
    >
      <LoginForm />
    </Suspense>
  );
}

