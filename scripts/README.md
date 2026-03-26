# Whop Experience ID Scripts

This directory contains scripts to help you manage your Whop integration.

## Scripts

### `get-experience-id.ts`
Lists all experiences for your company and outputs their IDs and names.

**Usage:**
```bash
npm run get-experience-id
```

**Requirements:**
- `WHOP_API_KEY` in `.env.local`
- `NEXT_PUBLIC_WHOP_APP_ID` in `.env.local` 
- `NEXT_PUBLIC_WHOP_COMPANY_ID` in `.env.local` (your Business ID, format: `biz_XXXXX`)

**Output:**
```
Fetching experiences...

Your Experiences:
=================

ID: exp_12345
Name: WhaleNet Pro
App: WhaleNet
Public: true
-----------------

ID: exp_67890
Name: WhaleNet Basic
App: WhaleNet
Public: false
-----------------
```

### `get-company-id.ts`
Attempts to automatically find your Whop Business ID (Company ID).

**Usage:**
```bash
npm run get-company-id
```

**Note:** This script may not work with all API keys. If it fails, you'll need to manually find your Business ID from the Whop dashboard.

### `create-experience.ts`
Creates a new experience for your WhaleNet app and attaches it to your WhaleNet product.

**Usage:**
```bash
npm run create-experience
```

**Requirements:**
- All requirements from `get-experience-id.ts`
- Your WhaleNet product must exist in Whop

### `list-products.ts`
Lists all products for your company with detailed information.

**Usage:**
```bash
npm run list-products
```

**Requirements:**
- `WHOP_API_KEY` in `.env.local`
- `NEXT_PUBLIC_WHOP_COMPANY_ID` in `.env.local`

**Output:**
```
Fetching products...

Your Products:

Product 1:
  ID: prod_aUJhY4S8H2u9P
  Name: N/A
  App ID: N/A
  Type: N/A
  Status: N/A
  Created: 18/03/2026, 07:17:10
-----------------

Product 2:
  ID: prod_8k81KInIqaZVb
  Name: N/A
  App ID: N/A
  Type: N/A
  Status: N/A
  Created: 17/03/2026, 13:53:59
-----------------

Total products found: 2
```

### `product-details.ts`
Gets detailed information about a specific product to understand its structure and capabilities.

**Usage:**
```bash
npm run product-details
```

**Requirements:**
- `WHOP_API_KEY` in `.env.local`
- `NEXT_PUBLIC_WHOP_COMPANY_ID` in `.env.local`

**Output:**
```
Fetching details for product: prod_RhZ9xEQ4wJz0L

Product Details:
{
  "id": "prod_RhZ9xEQ4wJz0L",
  "title": "WhaleNet",
  "visibility": "visible",
  "headline": "Real-time whale wallet tracking with instant Telegram alerts.",
  "verified": false,
  "created_at": "2026-03-17T13:32:46.177Z",
  "updated_at": "2026-03-20T10:46:11.937Z",
  "member_count": 1,
  "route": "whalenet-2e",
  "published_reviews_count": 0,
  "external_identifier": null
}

No experiences field found in product data

Key Product Fields:
- ID: prod_RhZ9xEQ4wJz0L
- Name: N/A
- App ID: N/A
- Type: N/A
- Status: N/A
- Created: 17/03/2026, 13:32:46
```

**Important Discovery:**
Your WhaleNet product uses `title` instead of `name` and doesn't have an `app_id` field. This explains why the create-experience script was failing. The product structure is different from what the API expects for experiences.

**Output:**
```
Creating WhaleNet experience...

Fetching products to find WhaleNet product...
Available products:
1. ID: prod_12345, Name: WhaleNet Pro, App ID: app_abc123
2. ID: prod_67890, Name: WhaleNet Basic, App ID: app_def456

Found WhaleNet product: WhaleNet Pro (ID: prod_12345)

Creating experience with the following data:
{
  "name": "WhaleNet Dashboard",
  "description": "Main dashboard experience for WhaleNet users with real-time whale tracking and alerts",
  "company_id": "biz_12345",
  "product_id": "prod_12345",
  "app_id": "app_abc123",
  "is_public": false,
  "settings": {
    "allow_guests": false,
    "max_guests": 0
  }
}

✅ Experience created successfully!
Experience Details:
ID: exp_98765
Name: WhaleNet Dashboard
Product: WhaleNet Pro
App: WhaleNet
Public: false
Created: 3/25/2026, 7:02:00 PM

🎉 Your WhaleNet experience is now ready!
You can use this experience ID in your application to check user access.
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Whop Configuration
WHOP_API_KEY=apik_your_api_key_here
NEXT_PUBLIC_WHOP_APP_ID=app_your_app_id_here
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_your_business_id_here
```

## Finding Your Whop IDs

1. **Business ID (Company ID):** Whop Dashboard → Settings → API → "Business ID"
2. **API Key:** Whop Dashboard → Settings → API → "API Key"
3. **App ID:** Your product's App Settings → "App ID"

## Troubleshooting

- **"NEXT_PUBLIC_WHOP_COMPANY_ID environment variable is not set"**: Add your Business ID to `.env.local`
- **API errors**: Verify your API key and IDs are correct
- **No experiences found**: Check that your Business ID is correct and you have experiences created

## Next Steps

Once you have your Experience ID, you can use it in your application to check user access to specific experiences.