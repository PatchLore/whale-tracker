import { WhopSDK } from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;

if (!apiKey) {
  throw new Error("Missing WHOP_API_KEY environment variable");
}

export const whopsdk = new WhopSDK({ apiKey, appId });
