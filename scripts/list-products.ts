import { Whop } from '@whop/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function listProducts() {
  const apiKey = process.env.WHOP_API_KEY;
  const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

  if (!apiKey) {
    console.error("Error: WHOP_API_KEY environment variable is not set");
    return;
  }

  if (!companyId) {
    console.error("Error: NEXT_PUBLIC_WHOP_COMPANY_ID environment variable is not set");
    console.log("Please add NEXT_PUBLIC_WHOP_COMPANY_ID to your .env.local file");
    return;
  }

  try {
    console.log("Fetching products...\n");
    
    const client = new Whop({
      apiKey: apiKey,
      appID: process.env.NEXT_PUBLIC_WHOP_APP_ID
    });

    const productsResponse = await client.products.list({ company_id: companyId });

    console.log("Your Products:");
    console.log("=================\n");
    
    productsResponse.data.forEach((product: any, index: number) => {
      console.log(`Product ${index + 1}:`);
      console.log(`  ID: ${product.id}`);
      console.log(`  Name: ${product.name || 'N/A'}`);
      console.log(`  App ID: ${product.app_id || 'N/A'}`);
      console.log(`  Type: ${product.type || 'N/A'}`);
      console.log(`  Status: ${product.status || 'N/A'}`);
      console.log(`  Created: ${product.created_at ? new Date(product.created_at).toLocaleString() : 'N/A'}`);
      console.log("-----------------\n");
    });
    
    console.log(`Total products found: ${productsResponse.data.length}`);
    
  } catch (error: any) {
    console.error("Error:", error.response?.data || error.message);
  }
}

listProducts();