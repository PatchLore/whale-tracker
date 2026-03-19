import { validateToken } from "@whop-apps/sdk";
import { headers } from "next/headers";

export async function verifyUserToken() {
  const result = await validateToken({
    headers: await headers()
  });
  return result; // returns { userId, appId }
}
