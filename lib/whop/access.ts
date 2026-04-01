import { whopsdk } from "@/lib/whop-sdk";

// Simple in-memory cache with TTL
interface CacheEntry {
  hasAccess: boolean;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 90 * 1000; // 90 seconds in milliseconds (meets 60-120s requirement)

/**
 * Extract Whop user ID from Whop token
 * This calls the Whop API to validate the token and get user ID
 */
async function getWhopUserIdFromToken(token: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.whop.com/v5/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const user = await res.json();
    return user.id || null;
  } catch {
    return null;
  }
}

/**
 * Check if a user has active Whop subscription access
 * @param identifier - Can be one of:
 *   1. Whop user token (string, typically starts with special characters)
 *   2. Whop user ID (already extracted, format varies)
 *   3. Supabase user ID (we'll need additional logic to map this)
 * @returns Promise<boolean> - true if user has active access, false otherwise
 */
export async function checkWhopAccess(identifier: string): Promise<boolean> {
  // First, check if identifier looks like a Whop token
  // Whop tokens are typically JWT-like or have specific format
  const mightBeToken = identifier.includes(".") || identifier.startsWith("eyJ"); // JWT heuristic

  let whopUserId: string;

  if (mightBeToken) {
    // It might be a Whop token, try to extract user ID
    const userId = await getWhopUserIdFromToken(identifier);
    if (!userId) {
      // Fail closed - if token is invalid, deny access
      return false;
    }
    whopUserId = userId;
  } else {
    // Assume it's already a Whop user ID
    whopUserId = identifier;
  }

  // Check cache first
  const cached = cache.get(whopUserId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.hasAccess;
  }

  const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
  if (!companyId) {
    console.error("[WhopAccess] Missing NEXT_PUBLIC_WHOP_COMPANY_ID environment variable");
    // Fail closed - if configuration is missing, deny access
    cache.set(whopUserId, { hasAccess: false, timestamp: Date.now() });
    return false;
  }

  try {
    const accessRes = await whopsdk.users.checkAccess(companyId, {
      id: whopUserId,
    });

    const hasAccess = accessRes.has_access === true;

    // Update cache
    cache.set(whopUserId, {
      hasAccess,
      timestamp: Date.now(),
    });

    return hasAccess;
  } catch (error) {
    console.error(
      `[WhopAccess] Error checking access for Whop user ${whopUserId}:`,
      error
    );

    // Fail closed - if API fails, deny access
    cache.set(whopUserId, {
      hasAccess: false,
      timestamp: Date.now(),
    });
    return false;
  }
}

/**
 * Clear cache for a specific Whop user (useful after webhook updates)
 */
export function clearWhopAccessCache(whopUserId: string): void {
  cache.delete(whopUserId);
}

/**
 * Clear entire cache (useful for testing or manual updates)
 */
export function clearAllWhopAccessCache(): void {
  cache.clear();
}

/**
 * Helper to extract Whop token from request headers
 */
export function getWhopTokenFromHeaders(headers: Headers): string | null {
  return headers.get("x-whop-user-token");
}

/**
 * Helper to get Whop user ID from various sources
 * This is what middleware should use instead of passing user.id directly
 */
export async function getWhopUserIdForAccessCheck(
  supabaseUserId: string,
  requestHeaders: Headers,
  requestCookies: { get: (name: string) => { value: string } | undefined }
): Promise<string | null> {
  // 1. Try to get Whop token from headers
  const whopToken = getWhopTokenFromHeaders(requestHeaders);
  if (whopToken) {
    const whopUserId = await getWhopUserIdFromToken(whopToken);
    if (whopUserId) {
      return whopUserId;
    }
  }

  // 2. Try to get Whop user ID from cookie
  const whopUserIdFromCookie = requestCookies.get("whop_user_id")?.value;
  if (whopUserIdFromCookie) {
    return whopUserIdFromCookie;
  }

  // 3. No Whop identifier found
  return null;
}
