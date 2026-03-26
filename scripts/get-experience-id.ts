import Whop from '@whop/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function getExperiences() {
  const apiKey = process.env.WHOP_API_KEY;
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

  if (!apiKey) {
    console.error("Error: WHOP_API_KEY environment variable is not set");
    return;
  }

  if (!appId) {
    console.error("Error: NEXT_PUBLIC_WHOP_APP_ID environment variable is not set");
    return;
  }

  if (!companyId) {
    console.error("Error: NEXT_PUBLIC_WHOP_COMPANY_ID environment variable is not set");
    console.log("Please add NEXT_PUBLIC_WHOP_COMPANY_ID to your .env.local file");
    return;
  }

  const client = new Whop({
    apiKey,
    appID: appId,
  });

  try {
    console.log("Fetching experiences...\n");
    
    const experiences = await client.experiences.list({
      company_id: companyId,
    });

    console.log("Your Experiences:");
    console.log("=================\n");
    
    for await (const exp of experiences) {
      console.log(`ID: ${exp.id}`);
      console.log(`Name: ${exp.name}`);
      console.log(`App: ${exp.app?.name || 'N/A'}`);
      console.log(`Public: ${exp.is_public}`);
      console.log("-----------------\n");
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

getExperiences();