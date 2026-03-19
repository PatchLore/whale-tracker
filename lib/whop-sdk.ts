import { makeUserTokenVerifier, WhopAPI } from "@whop-apps/sdk";

// Verifier for whop_user_token, configured with your app and API key.
const verifyUserToken = makeUserTokenVerifier({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
  apiKey: process.env.WHOP_API_KEY!
});

async function checkAccess(
  experienceId: string,
  user: { id: string }
): Promise<{ has_access: boolean }> {
  // Delegate to the Whop API; shape is kept loose to avoid over-constraining types.
  const res = await WhopAPI.app({ apiKey: process.env.WHOP_API_KEY! }).GET(
    "/apps/experiences/{experience_id}/access/{user_id}" as any,
    {
      params: {
        path: {
          experience_id: experienceId,
          user_id: user.id
        }
      }
    } as any
  );

  const hasAccess = (res as any)?.data?.has_access ?? false;
  return { has_access: hasAccess };
}

export const whopsdk = {
  verifyUserToken,
  users: {
    checkAccess
  }
};


