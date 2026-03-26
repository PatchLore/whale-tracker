import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function getCompanyId() {
  const apiKey = process.env.WHOP_API_KEY;

  if (!apiKey) {
    console.error("Error: WHOP_API_KEY environment variable is not set");
    return;
  }

  try {
    console.log("Attempting to get company information...\n");
    
    // Try to make a request to get company info
    // This might work if the API allows it without company ID
    const response = await axios.get('https://api.whop.com/v5/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("User info response:", JSON.stringify(response.data, null, 2));
    
    // Look for company information in the response
    if (response.data && response.data.company_id) {
      console.log(`\nFound company ID: ${response.data.company_id}`);
      console.log("Please add this to your .env.local file as NEXT_PUBLIC_WHOP_COMPANY_ID");
    } else {
      console.log("\nCompany ID not found in response. You may need to:");
      console.log("1. Check your Whop dashboard for the company ID");
      console.log("2. Contact Whop support for assistance");
      console.log("3. Look at existing API calls in your codebase");
    }
    
  } catch (error: any) {
    console.error("Error getting company info:", error.response?.data || error.message);
    
    // Try alternative approach - check if we can list companies
    try {
      console.log("\nTrying alternative approach...");
      const companiesResponse = await axios.get('https://api.whop.com/v5/companies', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Companies response:", JSON.stringify(companiesResponse.data, null, 2));
      
      if (companiesResponse.data && companiesResponse.data.length > 0) {
        console.log(`\nFound ${companiesResponse.data.length} company(ies):`);
        companiesResponse.data.forEach((company: any, index: number) => {
          console.log(`${index + 1}. ID: ${company.id}, Name: ${company.name}`);
        });
        console.log("\nPlease add the appropriate company ID to your .env.local file as NEXT_PUBLIC_WHOP_COMPANY_ID");
      }
      
    } catch (companiesError: any) {
      console.error("Alternative approach also failed:", companiesError.response?.data || companiesError.message);
      console.log("\nPlease manually find your company ID from:");
      console.log("1. Whop dashboard settings");
      console.log("2. Existing API documentation");
      console.log("3. Contacting Whop support");
    }
  }
}

getCompanyId();