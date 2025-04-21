# Cardano Smart Escrow

A secure, user-friendly escrow application built on the Cardano blockchain that allows users to lock and unlock ADA in a smart contract escrow.

## Features

- **Wallet Integration**: Connect with popular Cardano wallets
- **Lock Funds**: Securely lock ADA in an escrow smart contract
- **Transaction Monitoring**: Real-time transaction status updates
- **Unlock Funds**: Release funds from escrow when conditions are met
- **Transaction History**: View all your escrow transactions

## Technology Stack

### Frontend
- **Framework**: Next.js 15.x, React 19.x, TypeScript
- **Styling**: Tailwind CSS 4.x
- **State Management**: React Query (TanStack Query)
- **Wallet Integration**: [@ada-anvil/weld](https://github.com/ada-anvil/weld) for wallet connectivity

### Backend
- **Database**: SQLite for transaction storage and retrieval
- **Blockchain Integration**: 
  - Blockfrost webhooks for real-time Cardano transaction notifications
  - Anvil API for all Cardano transaction building and submission operations
- **Runtime**: Node.js with Next.js API routes

## Prerequisites

### Development Environment
- Node.js 18.x or higher
- npm/yarn/pnpm or bun
- SQLite (requires manual setup, see Installation section)

### External Services
- Anvil API account with API key (for Cardano transaction building)
- Blockfrost account with webhook configuration (for transaction notifications)
- **Pre-deployed escrow smart contract** with its validator hash (ESCROW_VALIDATOR_HASH)
- Ngrok or similar tool for local webhook development (optional)

### End User Requirements
- A compatible Cardano wallet extension (Eternl, Lace, etc.)
- Cardano testnet tokens for testing (on the preprod network)

## Installation

```bash
# Clone the repository
git clone https://github.com/ThomasEnoch/cardano-smart-escrow.git
cd cardano-smart-escrow

# Install dependencies (including dev dependencies for SQLite)
npm install --include=dev
# or
yarn install
# or
pnpm install --dev

# Create SQLite database directory
mkdir -p data

# Note: The database file will be created automatically when the app runs
# but you need to ensure the path in .env.local matches SQLITE_DB_PATH in .env.example
```

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Cardano network (preprod or mainnet)
CARDANO_NETWORK=preprod

# Blockfrost API key for Cardano blockchain data
BLOCKFROST_API_KEY=your_blockfrost_api_key

# Optional: Webhook secret for Blockfrost notifications
WEBHOOK_SECRET=your_webhook_secret
```

Also create a `.env.example` file with the same structure (without actual values) for reference.

## Development

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## API Routes

The application includes the following API endpoints:

- `GET /api/escrow/transactions?wallet={walletAddress}` - Get transactions for a wallet
- `POST /api/escrow/lock` - Create a new lock transaction
- `POST /api/escrow/unlock` - Create an unlock transaction
- `POST /api/escrow/submit` - Submit a signed transaction
- `POST /api/webhooks/blockfrost` - Webhook for Blockfrost transaction updates

## Project Workflow

### Escrow Transaction Flow

1. **Lock Funds**: 
   - User connects wallet and specifies amount to lock
   - Frontend calls API to build a lock transaction
   - Transaction is signed by the user's wallet
   - Signed transaction is submitted to the Cardano blockchain
   - Transaction is stored in SQLite with 'pending' status

2. **Transaction Monitoring**:
   - Blockfrost webhooks notify the application when transaction status changes
   - API endpoint receives webhook notifications and updates the database
   - Frontend polls for transaction updates when pending transactions exist

3. **Unlock Funds**:
   - User initiates unlock for a confirmed transaction
   - Frontend calls API to build an unlock transaction
   - Transaction is signed by the user's wallet
   - Signed transaction is submitted to the Cardano blockchain
   - Transaction status is updated to 'unlocked'

### Backend Architecture

- **Next.js API Routes**: Handle HTTP requests for transaction operations
- **SQLite Database**: Stores transaction data (hash, amount, status, timestamp)
- **Anvil API Integration**: Used for transaction building and blockchain interactions
- **Blockfrost Webhooks**: Provide real-time transaction notifications when blockchain state changes
- **Anvil API Integration**: Handles all direct blockchain interactions including:
  - Transaction building
  - Script address derivation
  - Transaction submission
