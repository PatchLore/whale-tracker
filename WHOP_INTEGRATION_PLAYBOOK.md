# Whop Integration Playbook for Next.js SaaS Apps

A production-ready guide to implement Whop authentication + payments in Next.js without the debugging hell.

---

## 1. Overview

**What Whop Does:**
- Authentication (user login via token)
- Membership management (gating features by tier)
- Payment processing (Stripe integration internally)
- Webhook events (real-time membership updates)

**High-Level Architecture:**
```
User Login
    ↓
Whop generates token (x-whop-user-token)
    ↓
Frontend sends token to Next.js backend (/api/whop/user)
    ↓
Backend verifies token with Whop API (v5/me)
    ↓
Backend gets user data + membership status
    ↓
Backend returns user to frontend
    ↓
Store in DB + session
```

---

## 2. Required Setup

### Find Your Whop IDs

1. **Business ID (biz_...)**
   - Go to Whop Dashboard → Settings → API
   - Look for "Business ID" or "Company ID"
   - Format: `biz_XXXXXXXXXXXXX`

2. **API Key (apik_...)**
   - Whop Dashboard → Settings → API
   - Generate new API key
   - Format: `apik_XXXXX...XXXXX`
   - **KEEP THIS SECRET** - server-only

3. **App ID (app_...)**
   - Whop Dashboard → Product Management → Your App
   - Format: `app_XXXXXXXXXXXXX`

### Environment Variables

**In `.env.local` (or Vercel environment):**

```bash
# Public (safe to expose)
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_G9fxOcl3SAmX9Z
NEXT_PUBLIC_WHOP_APP_ID=app_VbXNyVXdQ3S1Qz

# Secret (server-only)
WHOP_API_KEY=apik_e1RXJm9egzG20_C4614086_C_ebf00da11b2175aab98fded968b0468270995d72746b8ebd45d465ea6933b7
WHOP_WEBHOOK_SECRET=ws_fffefd5c67cc5b1acd7f4be9d80bea6a519e57775d2fc825054a94e513758ab1
```

---

## 3. Correct API Usage (CRITICAL)

### ❌ DEPRECATED (Will 404)

```
https://api.whop.com/api/v1/me
https://api.whop.com/api/v1/memberships
```

**Why it breaks:** Whop sunset v1 endpoints. Any old code using these will fail with 404.

### ✅ CURRENT ENDPOINTS

```
https://api.whop.com/v5/me          (Get current user)
https://api.whop.com/v5/memberships (List memberships - if needed)
```

**Always verify your code uses v5, not v1.**

---

## 4. Working Auth Flow (Step-by-Step)

### Step 1: Frontend Gets Token
- User visits experience/product page
- Whop injects token as `x-whop-user-token` header in request
- **Token location:** `requestHeaders.get("x-whop-user-token")`

### Step 2: Frontend → Backend
- Frontend calls your `/api/whop/user` endpoint
- Passes token in Authorization header:
  ```
  Authorization: Bearer {token}
  ```

### Step 3: Backend Verifies with Whop
- Backend strips `Bearer ` prefix from header
- Makes direct `fetch()` call to `https://api.whop.com/v5/me`
- Whop validates token and returns user data

### Step 4: Backend Returns User
- Backend sends user data back to frontend
- Frontend can now use: `user.id`, `user.email`, etc.

### Step 5: Store in DB
- Extract email from user response
- Upsert into `profiles` table
- Optionally cache in session/cookie

---

## 5. Backend Template (Copy-Paste Ready)

### Create `/app/api/whop/user/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Extract token from Authorization header
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    
    if (!token) {
      console.warn("[api/whop/user] No authorization token provided");
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    console.log("[api/whop/user] Fetching user from Whop API v5...");
    
    // Call Whop v5 endpoint
    const res = await fetch("https://api.whop.com/v5/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    console.log("[api/whop/user] Whop API response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[api/whop/user] Whop API error:", res.status, errorText);
      return NextResponse.json(
        { error: `Whop API error: ${res.status}`, details: errorText },
        { status: res.status }
      );
    }

    const user = await res.json();
    console.log("[api/whop/user] Successfully fetched user:", user.id);

    return NextResponse.json(user);
  } catch (err) {
    console.error("[api/whop/user] error", err);
    return NextResponse.json(
      { error: "Failed to fetch user", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
```

**Key points:**
- ✅ Uses `v5/me` (correct endpoint)
- ✅ Extracts token properly (`Bearer ` prefix removed)
- ✅ Caches disabled (`cache: "no-store"`)
- ✅ Detailed error logging
- ✅ Proper error responses

---

## 6. Frontend Template

### In Server Component (e.g., `/app/experiences/[experienceId]/page.tsx`)

```typescript
import { headers } from "next/headers";
import { supabaseServiceClient } from "@/lib/supabase/service";
import { DashboardClient } from "@/app/dashboard/DashboardClient";
import { whopsdk } from "@/lib/whop-sdk";

type ExperiencePageProps = {
  params: {
    experienceId: string;
  };
};

// Clean fallback UI components
function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold">WhaleNet 🐋</h1>
        <p className="mt-3 text-gray-400">
          You don't have access to this experience.
        </p>
      </div>
    </div>
  );
}

function WhopOnlyFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold">WhaleNet 🐋</h1>
        <p className="mt-3 text-gray-400">
          This app must be opened inside Whop.
        </p>
      </div>
    </div>
  );
}

function AuthErrorFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold">WhaleNet 🐋</h1>
        <p className="mt-3 text-gray-400">
          Unable to verify your session. Please try refreshing the page.
        </p>
      </div>
    </div>
  );
}

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const { experienceId } = params;
  const requestHeaders = await headers();

  // CRITICAL: Check for token FIRST - show clean UI instead of raw errors
  const token = requestHeaders.get("x-whop-user-token");
  if (!token) {
    console.log("[experiences] No Whop token found - showing fallback UI");
    return <WhopOnlyFallback />;
  }

  try {
    console.log("[experiences] Verifying user...");

    // Call your backend route
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const userResponse = await fetch(`${appUrl}/api/whop/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("[experiences] Failed to fetch user:", userResponse.status, errorText);
      throw new Error(`User verification failed: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    const email = userData?.email;

    if (!email) {
      throw new Error("No email in user data");
    }

    console.log("[experiences] User verified:", email);

    // Check company access
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
    if (!companyId) {
      throw new Error("Missing NEXT_PUBLIC_WHOP_COMPANY_ID");
    }

    const accessRes = await whopsdk.users.checkAccess(companyId, {
      id: userData.id
    });

    if (!accessRes.has_access) {
      return <AccessDenied />;
    }

    // Store in Supabase
    const { data: existingProfile } = await supabaseServiceClient
      .from("profiles")
      .select("id, tier")
      .eq("email", email)
      .maybeSingle();

    if (!existingProfile) {
      // Create new profile
      await supabaseServiceClient
        .from("profiles")
        .insert({
          email,
          tier: "pro",
          whop_user_id: userData.id,
        });
    } else if (existingProfile.tier !== "pro") {
      // Update existing profile
      await supabaseServiceClient
        .from("profiles")
        .update({ tier: "pro" })
        .eq("id", existingProfile.id);
    }

    return (
      <DashboardClient
        suppressAuthRedirect
        userId={existingProfile?.id}
      />
    );

  } catch (error) {
    console.error("[experiences] Auth error:", error);
    return <AuthErrorFallback />;
  }
}
```

**Key improvements:**
- ✅ **Early token check** - No raw errors for missing tokens
- ✅ **Clean fallback UI** - Professional appearance instead of error dumps
- ✅ **Three distinct states** - Different UI for different scenarios
- ✅ **Consistent branding** - WhaleNet logo and styling
- ✅ **Preserved auth logic** - All existing functionality intact
- ✅ **Better error handling** - Clean UI for API failures too

**UX States:**
- **No token** → "This app must be opened inside Whop"
- **Valid session** → Dashboard loads normally
- **API failure** → "Unable to verify your session. Please try refreshing"
- **No access** → "You don't have access to this experience"

---

## 7. UX Best Practices (CRITICAL FOR WHOP REVIEW)

### Never Show Raw Errors to Users

**❌ BAD:** Raw error messages visible to users
```typescript
return (
  <div>
    <h2>Unable to verify Whop session</h2>
    <p>Error: Missing x-whop-user-token</p>
  </div>
);
```

**✅ GOOD:** Clean, branded fallback UI
```typescript
function WhopOnlyFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold">YourApp 🐋</h1>
        <p className="mt-3 text-gray-400">
          This app must be opened inside Whop.
        </p>
      </div>
    </div>
  );
}
```

### Handle Missing Tokens Gracefully

**Key Pattern:** Check token **outside** try-catch block

```typescript
export default async function ExperiencePage({ params }) {
  const requestHeaders = await headers();
  
  // Check token FIRST - return clean UI immediately
  const token = requestHeaders.get("x-whop-user-token");
  if (!token) {
    return <WhopOnlyFallback />;
  }

  try {
    // Auth logic here...
  } catch (error) {
    return <AuthErrorFallback />;
  }
}
```

### Three Essential UI States

1. **No Token (Direct Access)** → Clean instruction to use Whop
2. **Auth Success** → Normal app functionality
3. **Auth Failure** → Clean error with retry suggestion

### Whop Review Requirements

- ✅ **No raw error dumps** visible to users
- ✅ **Professional appearance** on all screens
- ✅ **Clear user guidance** for proper usage
- ✅ **Consistent branding** across all states

**Pro Tip:** Test your app by visiting the experience URL directly in a browser. You should see the clean fallback, not error messages.

---

## 8. Common Errors (CRITICAL SECTION)

### Error: `404 /api/v1/me`

**Cause:** Using deprecated Whop endpoint

**Fix:** Change all occurrences of:
```
❌ https://api.whop.com/api/v1/me
✅ https://api.whop.com/v5/me
```

**Search your code:**
```bash
grep -r "api/v1" .
```

---

### Error: `Missing NEXT_PUBLIC_WHOP_COMPANY_ID`

**Cause:** Environment variable not set or misspelled

**Fix:**
1. Add to `.env.local`:
   ```
   NEXT_PUBLIC_WHOP_COMPANY_ID=biz_XXXXXXXXXXXXX
   ```
2. Restart dev server
3. Verify variable exists:
   ```bash
   echo $env:NEXT_PUBLIC_WHOP_COMPANY_ID  # PowerShell
   echo $NEXT_PUBLIC_WHOP_COMPANY_ID      # Bash
   ```

---

### Error: `401 Unauthorized` from Whop API

**Causes:**
1. Token is missing or malformed
2. Token has expired
3. Token format is wrong

**Fix:**
```typescript
// DEBUG: Log token details
const token = requestHeaders.get("x-whop-user-token");
console.log("Token exists:", !!token);
console.log("Token preview:", token?.slice(0, 50) + "...");
console.log("Authorization header:", req.headers.get("authorization")?.slice(0, 30));
```

---

### Error: `user.id is undefined`

**Cause:** Whop API returned empty response or wrong data structure

**Fix:**
```typescript
const user = await res.json();
console.log("Full user response:", JSON.stringify(user, null, 2));

// Check expected fields
if (!user?.id || !user?.email) {
  console.error("Invalid user response structure:", user);
  return NextResponse.json({ error: "Invalid user data" }, { status: 500 });
}
```

---

### Error: `Cannot find x-whop-user-token`

**Cause:** Token not being injected by Whop (usually on public pages)

**Fix:**
- Ensure page is loaded **inside Whop iframe/context**
- Check if you're trying to access token on **non-Whop pages**
- Token only exists on Whop-hosted experiences

---

### Error: `Environment variables not loading`

**Cause:** Dev server started before `.env.local` updated

**Fix:**
1. Stop dev server (Ctrl+C)
2. Delete `.next` cache:
   ```bash
   rm -r .next  # Linux/Mac
   rmdir /s .next  # PowerShell
   ```
3. Restart: `npm run dev`

---

## 9. Debug Checklist (FAST)

When auth stops working, go through this in order:

### 1. Check Endpoint Version
```bash
grep -r "api/v1" .
# Should return NOTHING
# If it does, replace with v5
```

### 2. Check Token Exists
```typescript
const token = requestHeaders.get("x-whop-user-token");
if (!token) console.error("🔴 NO TOKEN");
```

### 3. Check Header Format
```typescript
// Should be exactly this:
headers: {
  Authorization: `Bearer ${token}`,  // Case-sensitive "Bearer"
  "Content-Type": "application/json",
}
```

### 4. Check Environment Variables
```bash
# Verify in Vercel dashboard or .env.local
echo $env:NEXT_PUBLIC_WHOP_COMPANY_ID
echo $env:WHOP_API_KEY
```

### 5. Clear Cache & Restart
```bash
rm -r .next
npm run dev
```

### 6. Check Whop API Status
- Visit: https://status.whop.com
- Ensure no ongoing incidents

### 7. Verify Backend Route Exists
- File should be: `/app/api/whop/user/route.ts`
- Should respond at: `http://localhost:3000/api/whop/user`

### 8. Test Backend Directly
```bash
# In terminal:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/whop/user
```

---

## 10. Production Setup

### API Key Security

**✅ DO:**
- Store `WHOP_API_KEY` only in backend (server-side environment)
- Never commit keys to git
- Rotate keys regularly

**❌ DON'T:**
- Expose `WHOP_API_KEY` in frontend code
- Put it in `NEXT_PUBLIC_*` variables
- Commit keys to git history

### Vercel Environment Setup

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add:
   - `WHOP_API_KEY` (secret)
   - `WHOP_WEBHOOK_SECRET` (secret)
   - `NEXT_PUBLIC_WHOP_COMPANY_ID` (public)
   - `NEXT_PUBLIC_WHOP_APP_ID` (public)
3. Re-deploy for changes to take effect

### Caching Strategy

**Avoid calling Whop on every request:**

```typescript
// BAD: Every request hits Whop
export async function GET(req) {
  const user = await fetch("https://api.whop.com/v5/me", ...);
}

// GOOD: Cache in session/DB
export async function GET(req) {
  // Check session first
  const cachedUser = req.session?.user;
  if (cachedUser) return cachedUser;
  
  // Fall back to Whop if not cached
  const user = await fetch("https://api.whop.com/v5/me", ...);
  req.session.user = user;
  return user;
}
```

### Rate Limiting

Whop has rate limits. Cache aggressively:

```typescript
// Use Redis or in-memory cache
const userCache = new Map();

const getCachedUser = async (token) => {
  if (userCache.has(token)) {
    return userCache.get(token);
  }
  
  const user = await fetchFromWhop(token);
  userCache.set(token, user);
  
  // Cache for 1 hour
  setTimeout(() => userCache.delete(token), 3600000);
  
  return user;
};
```

---

## 11. Optional (Advanced)

### Webhooks - Real-Time Membership Updates

When membership status changes, Whop sends a POST to your webhook URL.

**Create `/app/api/whop/webhook/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Secret not configured" }, { status: 500 });
  }

  // Verify webhook signature
  const signature = req.headers.get("x-whop-signature");
  const rawBody = await req.text();
  
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody, "utf8");
  const expected = hmac.digest("hex");
  
  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const { type, data } = payload;
  
  const email = data?.user?.email || data?.customer?.email || data?.email;

  if (type === "membership_activated") {
    // Update tier to "pro"
    await supabaseServiceClient
      .from("profiles")
      .update({ tier: "pro" })
      .eq("email", email);
  }

  if (type === "membership_deactivated") {
    // Update tier to "free"
    await supabaseServiceClient
      .from("profiles")
      .update({ tier: "free" })
      .eq("email", email);
  }

  return NextResponse.json({ success: true });
}
```

**In Whop Dashboard:**
- Settings → Webhooks
- URL: `https://yourapp.com/api/whop/webhook`
- Select events: `membership_activated`, `membership_deactivated`

---

### Membership Gating

Restrict access to pro-only features:

```typescript
import { supabaseServiceClient } from "@/lib/supabase/service";

export async function checkAccess(userId: string, requiredTier: "free" | "pro") {
  const { data: profile } = await supabaseServiceClient
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single();

  if (!profile) return false;
  
  // Check if user has required tier
  return profile.tier === requiredTier || profile.tier === "pro";
}
```

---

### Paywall Logic

Show different content based on membership:

```typescript
export default async function FeaturePage() {
  const user = await getUser();
  
  if (user.tier === "free") {
    return <FreeVersion />;
  }
  
  if (user.tier === "pro") {
    return <ProVersion />;
  }
}
```

---

## Quick Reference

| Task | File | Key Code |
|------|------|----------|
| Backend verification | `/app/api/whop/user/route.ts` | `fetch("https://api.whop.com/v5/me")` |
| Frontend auth | `/app/experiences/[id]/page.tsx` | `requestHeaders.get("x-whop-user-token")` |
| Webhooks | `/app/api/whop/webhook/route.ts` | Verify signature, update DB |
| UX fallbacks | Fallback components | `WhopOnlyFallback()`, `AuthErrorFallback()` |

---

## When Things Break

1. **Check endpoint version** → Should be v5, not v1
2. **Check token exists** → Must be in x-whop-user-token header
3. **Check env vars** → Must match names exactly (case-sensitive)
4. **Clear cache** → Delete .next folder, restart server
5. **Check Whop status** → status.whop.com for outages
6. **UX test** → Visit experience URL directly - should show clean fallback

---

**Last Updated:** March 24, 2026
**Tested on:** Next.js 14+, Whop API v5
**Includes:** UX improvements for missing tokens
