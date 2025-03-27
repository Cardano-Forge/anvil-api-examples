# Anvil with Weld - Cardano Transaction App

A modern web application that enables users to connect their Cardano wallets and send ADA to other addresses. Built with Next.js, Anvil API, and Weld wallet integration.

## Architecture Overview

### Technology Stack

- **Next.js 15+**: React framework with App Router for both client and server components
- **TypeScript**: For type-safe code development
- **@ada-anvil/weld**: Library for Cardano wallet integration
- **Tailwind CSS**: For styling components
- **Anvil API**: Backend service for Cardano blockchain interaction

### Project Structure

```
src/
├── app/               # Next.js App Router
│   ├── api/           # API routes
│   │   └── transaction/
│   │       ├── build/    # Transaction building endpoint
│   │       └── submit/   # Transaction submission endpoint
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Main page component
├── components/        # Reusable UI components
│   ├── TransactionForm.tsx  # Form for creating transactions
│   ├── WalletConnector.tsx  # Wallet connection interface
│   └── WeldProvider.tsx     # Context provider for wallet
├── hooks/             # Custom React hooks
│   └── useTransactionSubmission.ts  # Hook for transaction flow
└── utils/             # Utility functions
    └── anvil-api.ts   # Anvil API integration
```

### Data Flow

1. **Wallet Connection**: User connects wallet via the WalletConnector component
2. **Transaction Creation**: User inputs recipient address and amount in TransactionForm
3. **API Flow**:
   - Frontend calls `/api/transaction/build` with wallet UTXOs, address, and transaction details
   - The transaction is built using Anvil API
   - User signs the transaction with their wallet
   - Frontend calls `/api/transaction/submit` to submit the signed transaction
   - Transaction hash is returned and displayed to the user

## Prerequisites

- Node.js 18+ and npm
- Anvil API key
- Cardano wallet extension (Nami, Eternl, Flint, or other compatible wallets)

## Environment Setup

Create a `.env.local` file in the project root with the following variables:

```
# Anvil API Key (Required)
ANVIL_API_KEY=your_api_key_here
NEXT_PUBLIC_NETWORK=preprod
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Guidelines

### Code Quality

- **ESLint and Prettier**: Run `npm run format:write` before committing changes
- **TypeScript**: Maintain proper type definitions for all components and functions

### Security Best Practices

- Never expose API keys in client-side code
- Validate all inputs, both client-side and server-side
- Use HTTPS for all API requests
- Implement proper error handling throughout the application

## API Documentation

### Transaction Building

**Endpoint**: `/api/transaction/build`

**Method**: POST

**Body**:

```json
{
  "changeAddress": "addr1...",
  "utxos": ["tx1...", "tx2..."],
  "outputs": [
    {
      "address": "addr1...",
      "lovelace": 1000000
    }
  ]
}
```

### Transaction Submission

**Endpoint**: `/api/transaction/submit`

**Method**: POST

**Body**:

```json
{
  "transaction": "serialized_tx_cbor",
  "signatures": ["signature1", "signature2"]
}
```

## License

[MIT](LICENSE)
