const WHOP_API_BASE = "https://api.whop.com";

type WhopMembership = {
  status?: string;
};

type WhopMembershipResponse = {
  memberships?: WhopMembership[];
};

export async function verifyWhopMembership(email: string): Promise<boolean> {
  const apiKey = process.env.WHOP_API_KEY;
  if (!apiKey) {
    console.warn("[whop] WHOP_API_KEY is not configured");
    return false;
  }

  try {
    const url = new URL("/v1/memberships", WHOP_API_BASE);
    url.searchParams.set("email", email);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      // Whop API is external; we always want fresh data.
      cache: "no-store"
    });

    if (!res.ok) {
      console.error("[whop] membership check failed", res.status);
      return false;
    }

    const data = (await res.json()) as WhopMembershipResponse;
    const memberships = data.memberships ?? [];

    return memberships.some(m =>
      (m.status ?? "").toLowerCase() === "active" ||
      (m.status ?? "").toLowerCase() === "valid"
    );
  } catch (err) {
    console.error("[whop] membership check error", err);
    return false;
  }
}

