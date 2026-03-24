🐋 Whop Integration Playbook for Next.js SaaS Apps (PRODUCTION VERSION)

A production-ready, plug-and-play guide to implementing Whop authentication + payments in Next.js without auth bugs, sync issues, or paywall drift.

1. Overview
What Whop Does
Authentication (user login via x-whop-user-token)
Membership & access control (source of truth)
Payments & subscriptions (handled internally)
Webhooks (real-time membership updates)
🔥 Core Architecture (FINAL TRUTH)
User opens app inside Whop
        ↓
Whop injects x-whop-user-token
        ↓
Next.js server reads token
        ↓
Server calls Whop API (v5/me)
        ↓
Whop returns membership + user
        ↓
APP DECIDES ACCESS (NOT SUPABASE)
        ↓
Optional: Supabase stores profile (cache only)
2. Required Setup
Find Your Whop IDs
Business ID
Whop Dashboard → Settings → API
Format: biz_XXXXX
API Key
Dashboard → API
Format: apik_XXXXX
❗ SERVER ONLY
App ID
Product → App Settings
Format: app_XXXXX
Environment Variables
# Public
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_xxxxx
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxx

# Secret
WHOP_API_KEY=apik_xxxxx
WHOP_WEBHOOK_SECRET=ws_xxxxx
3. API Rules (CRITICAL)
❌ Deprecated
https://api.whop.com/api/v1/me
✅ Correct
https://api.whop.com/v5/me
4. Auth Flow (FINAL)
Step-by-step
User opens app inside Whop
Whop injects x-whop-user-token
Next.js reads token from headers
Server calls Whop /v5/me
Whop returns:
user
memberships
status
App checks access
Optional: sync to Supabase
5. 🔐 CRITICAL RULE

❌ NEVER use Supabase to decide access
✅ ONLY use Whop API for entitlement checks

Supabase is now:

profile storage
analytics
caching

NOT:

authentication
paywall logic
tier checks
6. Core Access Module (REUSABLE FOR ALL APPS)
/lib/whop/access.ts
import { cache } from "react";

const WHOP_API = "https://api.whop.com/v5/me";

export const checkWhopAccess = cache(async (token: string) => {
  if (!token) return false;

  try {
    const res = await fetch(WHOP_API, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return false;

    const user = await res.json();

    const hasAccess = user?.memberships?.some((m: any) => {
      return (
        m.status === "active" &&
        m.product?.app_id === process.env.NEXT_PUBLIC_WHOP_APP_ID
      );
    });

    return hasAccess;
  } catch (err) {
    console.error("[whop access error]", err);
    return false;
  }
});
7. Backend Route
/app/api/whop/user/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  const res = await fetch("https://api.whop.com/v5/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Whop API error" },
      { status: res.status }
    );
  }

  const user = await res.json();

  return NextResponse.json(user);
}
8. Frontend Pattern (STANDARD FOR ALL APPS)
import { headers } from "next/headers";
import { checkWhopAccess } from "@/lib/whop/access";

export default async function Page() {
  const token = headers().get("x-whop-user-token");

  // 1. Not inside Whop
  if (!token) {
    return <WhopOnlyFallback />;
  }

  // 2. Access check via Whop (NOT DB)
  const hasAccess = await checkWhopAccess(token);

  if (!hasAccess) {
    return <AccessDenied />;
  }

  // 3. App renders
  return <Dashboard />;
}
9. UI STATES (MANDATORY)
No Token

→ "This app must be opened inside Whop"

No Access

→ "You don't have access"

Auth Failure

→ "Please refresh and try again"

10. 🚨 SUPABASE RULES (IMPORTANT)

Supabase is ONLY allowed for:

✔ user profiles
✔ caching Whop user ID
✔ app preferences
✔ analytics

NOT allowed for:

❌ tier checks
❌ subscription logic
❌ gating
❌ paywalls

11. Webhooks (Optional Sync Only)
if (type === "membership_activated") {
  await supabase
    .from("profiles")
    .update({ tier: "pro" })
    .eq("email", email);
}

⚠️ This is ONLY for UI caching — not access control.

12. PRODUCTION CHECKLIST (MANDATORY)

Before deploying ANY Whop app:

Auth
 Uses x-whop-user-token
 Uses /v5/me
 Uses checkWhopAccess()
Security
 No Supabase gating logic
 No tier-based middleware checks
 No /api/v1 usage
UX
 Clean fallback UI
 No raw errors shown
 Works outside Whop (fallback state)
Stability
 Cached access checks
 Webhook optional only
 No auth dependency on DB
13. FINAL ARCHITECTURE (CORRECT SYSTEM)
            WHOP (SOURCE OF TRUTH)
                      ↓
        x-whop-user-token injected
                      ↓
        Next.js server validates token
                      ↓
        Whop API returns entitlement
                      ↓
        APP grants/denies access
                      ↓
        Supabase = optional storage only