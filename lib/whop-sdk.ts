import { Whop } from "@whop/sdk";

// Validate environment variables at startup
const apiKey = process.env.WHOP_API_KEY;
const appID = process.env.NEXT_PUBLIC_WHOP_APP_ID;

if (!apiKey) {
  console.error("[Whop SDK] WHOP_API_KEY is missing");
}

if (!appID) {
  console.error("[Whop SDK] NEXT_PUBLIC_WHOP_APP_ID is missing");
}

// Only log first 10 chars of API key for debugging (never full key)
if (apiKey) {
  console.log("[Whop SDK] API Key present (first 10 chars):", apiKey.substring(0, 10));
}

export const whopsdk = new Whop({
  apiKey: apiKey!,
  appID: appID!,
});
