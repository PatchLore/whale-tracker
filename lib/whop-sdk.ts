import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;

if (!apiKey || !appId) {
  throw new Error(`Missing WHOP_API_KEY (${apiKey ? "set" : "missing"}) or NEXT_PUBLIC_WHOP_APP_ID (${appId ? "set" : "missing"})`);
}

export const whopsdk = new Whop({ 
  apiKey, 
  appID: appId  // Must be appID (capital D), not appId
});
