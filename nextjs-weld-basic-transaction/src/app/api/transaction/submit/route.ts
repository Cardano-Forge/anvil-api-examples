import { NextRequest, NextResponse } from "next/server";
import { submitTransaction, SubmitTransactionParams } from "@/utils/anvil-api";

/**
 * Submit a signed Cardano transaction to the blockchain using Anvil API
 *
 * This endpoint accepts:
 * - transaction: The transaction CBOR (can be unsigned)
 * - signatures: Optional array of signatures from the wallet
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction, signatures } = body as SubmitTransactionParams;

    if (!transaction) {
      return NextResponse.json(
        { error: "Missing transaction" },
        { status: 400 },
      );
    }

    // Call utility function to submit the transaction
    const submissionData = await submitTransaction({ transaction, signatures });

    // Return the transaction hash and success message
    return NextResponse.json({
      hash: submissionData.txHash,
      message: "Transaction submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting transaction:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit transaction",
      },
      { status: 500 },
    );
  }
}
