import { WhopSDK } from "@whop-apps/sdk";

export const whopsdk = new WhopSDK({ token: process.env.WHOP_API_KEY! });

