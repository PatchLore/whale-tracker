import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ActivationState = {
  activated: boolean;
  timeout: boolean;
};

export function useActivationCheck(isNewLogin: boolean): ActivationState {
  const [activated, setActivated] = useState(false);
  const [timeout, setTimeoutReached] = useState(false);

  useEffect(() => {
    if (!isNewLogin) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const {
        data: { session }
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const poll = async () => {
        if (cancelled) return;
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("tier")
          .eq("id", userId)
          .single();

        if (error) {
          return;
        }

        if (profile?.tier === "pro") {
          setActivated(true);
          setTimeoutReached(false);
          if (intervalId) clearInterval(intervalId);
          if (timeoutId) clearTimeout(timeoutId);
        }
      };

      // initial check
      await poll();

      if (!activated) {
        intervalId = setInterval(poll, 2000);
        timeoutId = setTimeout(() => {
          if (intervalId) clearInterval(intervalId);
          setTimeoutReached(true);
        }, 10000);
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isNewLogin]);

  return { activated, timeout };
}

