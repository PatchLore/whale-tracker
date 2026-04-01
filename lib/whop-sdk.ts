import { Whop } from "@whop/sdk";

// Validate environment variables at startup
const apiKey = process.env.WHOP_API_KEY;
const appID = process.env.NEXT_PUBLIC_WHOP_APP_ID;

if (!apiKey) {
  throw new Error("[Whop SDK] WHOP_API_KEY is missing");
}

if (!appID) {
  throw new Error("[Whop SDK] NEXT_PUBLIC_WHOP_APP_ID is missing");
}

export const whopsdk = new Whop({
  apiKey: apiKey!,
  appID: appID!,
});
