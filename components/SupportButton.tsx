"use client";

import { useState, type FormEvent } from "react";

interface SupportButtonProps {
  userId: string;
}

export function SupportButton({ userId }: SupportButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmed = message.trim();
    if (!trimmed) {
      setError("Please describe your issue before sending.");
      return;
    }

    setStatus("sending");

    const response = await fetch("/api/support", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: trimmed, userId })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setStatus("error");
      setError(
        payload?.error || payload?.message || "Unable to send support request."
      );
      return;
    }

    setStatus("success");
    setMessage("");
    window.setTimeout(() => {
      setOpen(false);
      setStatus("idle");
    }, 1800);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-slate-700 bg-slate-900 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-100 transition hover:border-amber-400 hover:text-amber-300 dark:bg-slate-800"
      >
        Contact Support
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-white p-6 shadow-xl dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Contact support</h2>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Send a message directly to Whop support from WhaleNet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-300 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-700 transition hover:border-amber-400 dark:border-slate-600 dark:text-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-300/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Describe the issue, your account details, or any billing question..."
              />
              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
                  {error}
                </div>
              )}
              {status === "success" && (
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
                  Support request sent successfully.
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="rounded-2xl bg-amber-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Sending…" : "Send message"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-slate-700 transition hover:border-amber-400 dark:border-slate-600 dark:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
