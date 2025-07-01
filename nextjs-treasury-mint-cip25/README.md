# Cardano NFT Minting Platform

A Next.js application that demonstrates how to create CIP-25 NFTs on the Cardano blockchain using the Anvil API and wallet connectivity. This platform features a treasury-funded minting process, where all transaction fees are paid by a backend treasury wallet, providing a seamless, fee free experience for the user.

## Features

- **Treasury-Funded Minting**: All transaction fees are paid by a backend treasury wallet, offering a fee-free user experience.
- **Single-Click Minting**: Streamlined backend process handles transaction creation, signing, and submission in a single API call.
- **CIP-25 NFT Minting**: Create standard-compliant NFTs on Cardano.
- **Wallet Integration**: Connect with Cardano wallets using @ada-anvil/weld.

## Prerequisites

- Node.js (version 18 or later)
- npm or yarn package manager
- Any CIP-30 compatible browser wallet (Eternl, Lace, Begin, etc.)
- Anvil API access key
- Blockfrost API project ID

## Getting Started

### Environment Setup

1. Clone this repository
2. Copy `.env.example` to `.env.local` and fill in your configuration values:

```
ANVIL_API_URL=https://preprod.api.ada-anvil.app/v2/services
ANVIL_API_KEY=your_anvil_api_key
POLICY_KEY_HASH=your_policy_key_hash
POLICY_SIGN_KEY=your_policy_private_key
TREASURY_ADDRESS=your_treasury_address
TREASURY_SIGN_KEY=your_treasury_private_key
POLICY_EXPIRATION_DATE=your_policy_expiration_date (YYYY-MM-DD format)
BLOCKFROST_PROJECT_ID=your_blockfrost_project_id
BLOCKFROST_BASE_URL=https://cardano-preprod.blockfrost.io/api/v0
```

### Installation

```bash
npm install
# or
yarn install
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

## How It Works

### Architecture

This application uses a combination of frontend and backend technologies to enable a secure and smooth NFT minting experience:

1.  **Frontend**: A simple React interface built with Next.js. Users connect their wallet to specify a receiving address for the NFT, but no client-side transaction signing is required.
2.  **Backend**: Next.js API routes manage the entire transaction lifecycle. The backend fetches UTXOs from the treasury wallet, builds the minting transaction, signs it with both the policy and treasury keys, and submits it to the blockchain via the Anvil API.
3.  **Treasury Wallet**: A dedicated backend wallet pays for all transaction fees, abstracting away the complexity of fee fees from the end-user.

### Key Components

- **WalletConnector**: Manages wallet connections using @ada-anvil/weld.
- **MintForm**: Handles the user-facing minting flow, initiating a single API call.
- **`/api/mint` Route**: The core backend logic that orchestrates the entire minting process.
- **Anvil Integration**: Facilitates interaction with the Cardano blockchain for transaction building and submission.
- **Blockfrost Integration**: Fetches UTXOs from the treasury wallet.

## API Endpoints

- **POST /api/mint**: A single endpoint that handles the entire minting process. It creates the transaction, signs it with the necessary policy and treasury keys, and submits it to the Cardano blockchain.

## Security Considerations

- API keys are stored securely in environment variables
- User input validation is implemented
- Authentication is handled through wallet signatures
- HTTPS is used for all external requests
- Protect the Policy Key securely as it authorizes all minting transactions

## Development and Contribution

Feel free to fork this repository and submit PRs for any improvements. Please follow the code quality standards and git best practices outlined in the codebase.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Cardano CIP-25 Standard](https://cips.cardano.org/cips/cip25/)
- [Anvil API Documentation](https://docs.ada-anvil.app/)
- [Blockfrost API Documentation](https://docs.blockfrost.io/)
