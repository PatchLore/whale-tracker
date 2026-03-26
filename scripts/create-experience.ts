import { Whop } from '@whop/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function createExperience() {
  const apiKey = process.env.WHOP_API_KEY;
  const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;

  if (!apiKey) {
    console.error("Error: WHOP_API_KEY environment variable is not set");
    return;
  }

  if (!companyId) {
    console.error("Error: NEXT_PUBLIC_WHOP_COMPANY_ID environment variable is not set");
    console.log("Please add NEXT_PUBLIC_WHOP_COMPANY_ID to your .env.local file");
    return;
  }

  if (!appId) {
    console.error("Error: NEXT_PUBLIC_WHOP_APP_ID environment variable is not set");
    console.log("Please add NEXT_PUBLIC_WHOP_APP_ID to your .env.local file");
    return;
  }

  try {
    console.log("Creating WhaleNet experience...\n");
    console.log("Debug info:");
    console.log("- API Key:", apiKey ? "Set" : "Not set");
    console.log("- Company ID:", companyId || "Not set");
    console.log("- App ID:", appId || "Not set");

    // Initialize Whop SDK
    const client = new Whop({
      apiKey: apiKey,
      appID: appId
    });

    // First, let's get the product ID by listing products
    console.log("Fetching products to find WhaleNet product...");
    const productsResponse = await client.products.list({ company_id: companyId });

    console.log("Available products:");
    productsResponse.data.forEach((product: any, index: number) => {
      console.log(`${index + 1}. ID: ${product.id}, Name: ${product.name}, App ID: ${product.app_id}`);
    });

    // Find WhaleNet product
    const whaleNetProduct = productsResponse.data.find((product: any) => 
      (product.name && product.name.toLowerCase().includes('whalenet')) || 
      product.app_id === appId
    );

    let selectedProduct = whaleNetProduct;

    if (!selectedProduct) {
      console.error("Could not find WhaleNet product automatically.");
      console.log("Available products:");
      productsResponse.data.forEach((product: any, index: number) => {
        console.log(`${index + 1}. ID: ${product.id}`);
      });
      
      // For now, let's use the first product as a fallback
      if (productsResponse.data.length > 0) {
        console.log("\nUsing first available product as fallback...");
        selectedProduct = productsResponse.data[0];
      } else {
        console.error("No products found. Please create a product in your Whop dashboard first.");
        return;
      }
    }

    console.log(`\nUsing product: ${selectedProduct.id}`);

    // Create the experience
    console.log("\nCreating experience...");
    
    const experienceData = {
      name: "WhaleNet Dashboard",
      description: "Main dashboard experience for WhaleNet users with real-time whale tracking and alerts",
      company_id: companyId,
      product_id: selectedProduct.id,
      app_id: appId,
      is_public: false,
      settings: {
        allow_guests: false,
        max_guests: 0
      }
    };

    console.log("Creating experience with the following data:");
    console.log(JSON.stringify(experienceData, null, 2));

    const response = await client.experiences.create(experienceData);

    console.log("\n✅ Experience created successfully!");
    console.log("Experience Details:");
    console.log("==================");
    console.log(`ID: ${response.id}`);
    console.log(`Name: ${response.name}`);
    console.log(`Public: ${response.is_public}`);
    console.log(`Created: ${new Date(response.created_at).toLocaleString()}`);
    
    // Log the full response for debugging
    console.log("\nFull response object:");
    console.log(JSON.stringify(response, null, 2));
    
    console.log("\n🎉 Your WhaleNet experience is now ready!");
    console.log("You can use this experience ID in your application to check user access.");

  } catch (error: any) {
    console.error("❌ Error creating experience:", error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log("\n💡 Common issues:");
      console.log("- Make sure the product ID is correct");
      console.log("- Check that the app ID matches your WhaleNet app");
      console.log("- Verify the company ID is your Business ID");
    }
    
    if (error.response?.status === 401) {
      console.log("\n💡 Authentication issues:");
      console.log("- Verify your WHOP_API_KEY is correct");
      console.log("- Make sure your API key has the necessary permissions");
    }
  }
}

createExperience();