# WhaleNet - App Summary

## Overview
WhaleNet is a real-time cryptocurrency whale wallet tracking application built with Next.js. It monitors large cryptocurrency wallets ("whales") and provides instant alerts when significant transactions occur. The app is distributed exclusively through Whop as a SaaS product (£9.99/month Pro plan).

## What the App Does

### Core Functionality
1. **Wallet Tracking**: Users can add up to 50 wallet addresses to monitor on supported blockchain networks
2. **Real-Time Polling**: The app polls tracked wallets every 30 seconds for new transactions using Etherscan API
3. **Whale Detection**: Each wallet has a customizable ETH threshold - transactions exceeding this amount are flagged as "whale" moves
4. **Activity Feed**: Displays all transactions with directional context (incoming vs outgoing)
5. **Instant Alerts**: Sends notifications via Telegram and browser notifications when whale transactions are detected
6. **Multi-Chain Support**: Supports Ethereum, BSC (Binance Smart Chain), and Polygon networks

### User Features
- **Dashboard**: Stats bar showing wallets tracked, transactions seen, whale alerts, largest move, and poll interval
- **Wallet Registry**: Add/remove wallets, set labels, configure chains and thresholds
- **Activity Feed**: Filterable transaction feed (all/whale/incoming/outgoing)
- **Telegram Integration**: Users can link their Telegram chat ID to receive alerts
- **Theme Toggle**: Dark/light mode support
- **Support System**: Integrated support ticket system via Whop

## APIs Used

### 1. **Etherscan API v2**
- **Endpoint**: `https://api.etherscan.io/v2/api`
- **Purpose**: Polls blockchain transactions for tracked wallets
- **Supported Chains**:
  - Ethereum mainnet (chainId: 1)
  - BSC/Binance Smart Chain (chainId: 56)
  - Polygon/Matic (chainId: 137)
- **API Key**: Required (`ETHERSCAN_API_KEY` environment variable)
- **Usage**: Fetches last 1000 transactions (limited to 50 most recent for processing) for each wallet every 30 seconds

### 2. **Whop API**
- **Endpoints**:
  - `https://api.whop.com/v5/me` - Fetch current user information
  - Whop SDK methods for support channels and messaging
- **Purpose**: 
  - User authentication and identity management
  - Membership/billing management (£9.99/month Pro plan)
  - Support ticket system
  - Webhook handling for membership activation/deactivation
- **Integration Points**:
  - `/api/whop/user` - Get Whop user details
  - `/api/whop/webhook` - Handle membership changes
  - `/api/support` - Create support channels and send messages via Whop SDK

### 3. **Telegram Bot API**
- **Endpoint**: `https://api.telegram.org/bot<TOKEN>/sendMessage`
- **Purpose**: Send whale alert notifications to users
- **API Key**: Required (`TELEGRAM_BOT_TOKEN` environment variable)
- **Usage**: Sends formatted whale alerts with transaction details (direction, ETH amount, USD approximation, Etherscan link)

### 4. **Supabase**
- **Purpose**: Backend database and authentication
- **Usage**:
  - **Authentication**: User sessions via Supabase Auth
  - **Database Tables**:
    - `wallets` - Stores tracked wallet addresses, chains, thresholds
    - `transactions` - Stores transaction history with hash, direction, ETH value, whale status
    - `profiles` - User profiles with Telegram chat ID
  - **Client Libraries**: Both server-side (`@supabase/ssr`) and browser clients

## Internal API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/poll` | POST | Poll Etherscan for new transactions on a specific wallet |
| `/api/wallets` | GET | List all wallets for the authenticated user |
| `/api/wallets` | POST | Add a new wallet to track |
| `/api/wallets` | PATCH | Update wallet threshold or label |
| `/api/wallets` | DELETE | Remove a wallet |
| `/api/support` | POST | Create Whop support channel and send message |
| `/api/alerts/telegram` | POST | Send Telegram alert notification |
| `/api/whop/user` | GET | Fetch Whop user information |
| `/api/whop/webhook` | POST | Handle Whop membership webhooks |

## Technical Architecture

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS with custom theme (amber/gold color scheme)
- **State Management**: React hooks (useState, useEffect, useMemo)
- **Real-time Updates**: Custom `usePolling` hook with 30-second intervals
- **Fonts**: Orbitron (headings), IBM Plex Mono (monospace)

### Backend
- **Runtime**: Next.js API routes (serverless functions)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Whop user tokens (x-whop-user-token header)
- **Blockchain Data**: Etherscan API v2

### Integration Flow
1. User accesses app via Whop iframe or direct login
2. Whop user token is validated and matched to Supabase user
3. User adds wallets with custom thresholds
4. Polling system checks wallets every 30 seconds via Etherscan
5. New transactions are stored in Supabase
6. Whale transactions trigger Telegram/browser notifications
7. Activity feed displays all transactions in real-time

## Environment Variables Required
- `WHOP_API_KEY` - Whop SDK authentication
- `NEXT_PUBLIC_WHOP_APP_ID` - Whop app identifier
- `WHOP_COMPANY_ID` - Whop company ID for support
- `WHOP_WEBHOOK_SECRET` - Verify Whop webhook signatures
- `ETHERSCAN_API_KEY` - Etherscan API access
- `TELEGRAM_BOT_TOKEN` - Telegram bot for alerts
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key