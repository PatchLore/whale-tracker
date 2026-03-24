import { headers } from "next/headers";
import { supabaseServiceClient } from "@/lib/supabase/service";
import { DashboardClient } from "@/app/dashboard/DashboardClient";
import { whopsdk } from "@/lib/whop-sdk";

function AccessDenied() {
  return <div>Access denied</div>;
}

function UnableToVerifySession() {
  return <div>Unable to verify Whop session</div>;
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  try {
    const { experienceId } = await params;
    const requestHeaders = await headers();

    const { userId } = await whopsdk.verifyUserToken(requestHeaders);

    const accessRes = await whopsdk.users.checkAccess(experienceId, {
      id: userId,
    });

    if (!accessRes.has_access) {
      return <AccessDenied />;
    }

    return (
      <DashboardClient
        suppressAuthRedirect
        userId={userId}
      />
    );
  } catch {
    return <UnableToVerifySession />;
  }
}