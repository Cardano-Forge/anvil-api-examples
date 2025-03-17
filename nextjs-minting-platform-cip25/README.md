# Cardano NFT Minting Platform

A Next.js application that demonstrates how to create CIP-25 NFTs on the Cardano blockchain using the Anvil API, Redis for caching, and wallet connectivity. This platform provides a simple, user-friendly interface for minting NFTs on Cardano.

## Features

- **CIP-25 NFT Minting**: Create standard-compliant NFTs on Cardano
- **Wallet Integration**: Connect with Cardano wallets using @ada-anvil/weld
- **Redis Caching**: Efficient data storage and retrieval
- **API Routes**: Secure backend implementation using Next.js API routes

## Prerequisites

- Node.js (version 18 or later)
- npm or yarn package manager
- Redis server (any datastore will work. Redis is only for this example)
- Cardano wallet (Eternl) Currently Eternl is the only wallet supported, but you can grab the entire list of wallets using CIP-30 functions.
- Anvil API access key

## Getting Started

### Environment Setup

1. Clone this repository
2. Copy `.env.example` to `.env.local` and fill in your configuration values:

```
ANVIL_API_URL=https://api.anvil.io
ANVIL_API_KEY=your_anvil_api_key
POLICY_KEY_HASH=your_policy_key_hash
POLICY_SIGN_KEY=your_policy_private_key
REDIS_URL=your_redis_connection_string
TREASURY_BASE_ADDRESS=addr_test...
POLICY_EXPIRATION_DATE=your_policy_expiration_date ex: 2030-01-01
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

### Starting Redis

You can start Redis using one of the following methods:

```bash
# Using Docker
docker run -it --rm --name redis -p 6379:6379 redis

# Using Podman
podman run -d --name redis -p 6379:6379 redis

# Using the Redis service (Linux)
sudo service redis-server start
```

> **Note**: Redis is used in this example, but you can replace it with any database of your choice. The application is designed to be flexible with different data storage solutions.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## How It Works

### Architecture

This application uses a combination of frontend and backend technologies:

1. **Frontend**: React components with Next.js for routing and rendering
2. **Backend**: Next.js API routes for secure server-side operations
3. **Database**: Redis for data caching and storage
4. **Blockchain Interaction**: Anvil API for Minting and Submitting Cardano transactions

### Key Components

- **WalletConnector**: Manages wallet connections using @ada-anvil/weld
- **MintForm**: Handles the NFT minting process
- **API Routes**: Process minting requests and transaction submissions
- **Redis Client**: Manages caching and data persistence
- **Anvil Integration**: Facilitates interaction with the Cardano blockchain

## API Endpoints

- **POST /api/mint**: Creates a new NFT minting transaction
- **POST /api/submit**: Signs and submits the transaction to the blockchain

## Security Considerations

- API keys are stored securely in environment variables
- User input validation is implemented
- Authentication is handled through wallet signatures
- HTTPS is used for all external requests

## Development and Contribution

Feel free to fork this repository and submit PRs for any improvements. Please follow the code quality standards and git best practices outlined in the codebase.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Cardano CIP-25 Standard](https://cips.cardano.org/cips/cip25/)
- [Anvil API Documentation](ADD_URL)
- [Redis Documentation](https://redis.io/documentation)

## License

MIT
