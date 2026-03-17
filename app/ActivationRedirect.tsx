"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function ActivationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const activated = searchParams.get("activated");
    if (activated === "true") {
      router.replace("/activating");
    }
  }, [router, searchParams]);

  return null;
}

