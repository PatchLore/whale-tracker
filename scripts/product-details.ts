import { Whop } from '@whop/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function getProductDetails() {
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
    const productId = 'prod_RhZ9xEQ4wJz0L';
    
    console.log(`Fetching details for product: ${productId}\n`);
    
    const client = new Whop({
      apiKey: apiKey,
      appID: process.env.NEXT_PUBLIC_WHOP_APP_ID
    });

    // Get the specific product
    const productsResponse = await client.products.list({ company_id: companyId });
    const product = productsResponse.data.find(p => p.id === productId);
    
    if (!product) {
      console.error(`Product ${productId} not found in your company's products`);
      return;
    }
    
    console.log("Product Details:");
    console.log("================");
    console.log(JSON.stringify(product, null, 2));
    
    // Also check if there's an experiences field or related data
    const productAny = product as any;
    if (productAny.experiences) {
      console.log("\nExperiences attached to this product:");
      console.log(productAny.experiences);
    } else {
      console.log("\nNo experiences field found in product data");
    }
    
    // Check for other relevant fields
    console.log("\nKey Product Fields:");
    console.log(`- ID: ${product.id}`);
    console.log(`- Name: ${productAny.name || 'N/A'}`);
    console.log(`- App ID: ${productAny.app_id || 'N/A'}`);
    console.log(`- Type: ${productAny.type || 'N/A'}`);
    console.log(`- Status: ${productAny.status || 'N/A'}`);
    console.log(`- Created: ${productAny.created_at ? new Date(productAny.created_at).toLocaleString() : 'N/A'}`);
    
  } catch (error: any) {
    console.error("Error:", error.response?.data || error.message);
  }
}

getProductDetails();