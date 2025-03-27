import { NextRequest, NextResponse } from 'next/server';
import { buildTransaction, BuildTransactionParams } from '@/utils/anvil-api';

/**
 * Build a Cardano transaction using Anvil API
 * 
 * This endpoint builds a transaction with the provided inputs and outputs
 * It requires:
 * - changeAddress: The sender's address for change
 * - utxos: Array of UTXOs from the wallet
 * - outputs: Where to send the ADA/assets with amounts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { changeAddress, utxos, outputs } = body as BuildTransactionParams;
    
    if (!changeAddress || !utxos || !outputs) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Call utility function to build the transaction
    const transactionData = await buildTransaction({ changeAddress, utxos, outputs });

    // Return the transaction data for signing
    return NextResponse.json({
      hash: transactionData.hash,
      complete: transactionData.complete,
      stripped: transactionData.stripped,
      witnessSet: transactionData.witnessSet
    });
  } catch (error) {
    console.error("Error building transaction:", error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to build transaction" },
      { status: 500 }
    );
  }
}
