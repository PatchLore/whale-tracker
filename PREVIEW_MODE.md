# Preview Mode Implementation

This document explains how to use the preview mode for app reviewers.

## What Was Implemented

1. **DemoDashboard Component** (`components/DemoDashboard.tsx`)
   - Shows a fully functional dashboard with mock data
   - Includes 5 sample wallet addresses being tracked
   - Displays 6 sample whale transaction alerts
   - All interactive elements are disabled in demo mode
   - Clear "DEMO MODE" and "PREVIEW MODE" banners

2. **Preview Mode Logic** (`app/experiences/[experienceId]/page.tsx`)
   - Checks for `NEXT_PUBLIC_REVIEW_MODE=true` environment variable
   - Checks for `?preview=true` URL parameter
   - If either is true, bypasses authentication and paywall
   - Shows the DemoDashboard instead of the real app

3. **Environment Variable** (`.env.example`)
   - Added `NEXT_PUBLIC_REVIEW_MODE=false` (default)

## How to Use for App Store Review

### Option 1: URL Parameter (Recommended for Testing)
Add `?preview=true` to your app URL:
```
https://your-app.whop.com/experiences/your-experience-id?preview=true
```

### Option 2: Environment Variable (For Vercel Deployment)
Set `NEXT_PUBLIC_REVIEW_MODE=true` in your Vercel environment variables.

## Steps to Get Your App Approved

1. **Deploy to Vercel** with the preview mode enabled via URL parameter or environment variable

2. **Take Screenshots** with `?preview=true` in the URL to show:
   - The dashboard with sample wallets
   - The activity feed with whale transactions
   - The wallet registry section
   - The stats bar showing tracking metrics

3. **Submit for Review** to Whop/App Store with the preview-enabled URL

4. **After Approval**, remove the preview mode:
   - Remove the `?preview=true` parameter from any documentation
   - Set `NEXT_PUBLIC_REVIEW_MODE=false` in Vercel (or remove it entirely)
   - The app will now show the normal authentication/paywall

## Important Notes

- **Do NOT leave preview mode enabled in production after approval** - this would allow anyone to bypass your paywall
- The demo mode shows realistic data with:
  - 5 example wallets (Justin Sun, Vitalik Buterin, Binance, etc.)
  - 6 transactions ranging from 12.75 ETH to 500 ETH
  - Both incoming and outgoing transactions
  - Whale and non-whale alerts
- All wallet management features are disabled in demo mode (add/remove/edit)
- The Telegram integration is shown as disconnected in demo mode

## Files Modified

- `components/DemoDashboard.tsx` - New component with mock data
- `app/experiences/[experienceId]/page.tsx` - Added preview mode detection
- `.env.example` - Added `NEXT_PUBLIC_REVIEW_MODE` documentation

## Testing Locally

To test preview mode locally, run your dev server and visit:
```
http://localhost:3000/experiences/your-experience-id?preview=true
```

You should see the demo dashboard with sample data and "DEMO MODE" indicators.