import { NextResponse } from "next/server";
import { upsertWallet, upsertTx } from "@/lib/db";
import { TX_STATUS } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    for (const event of body.payload) {
      const wallet = event.inputs?.[0]?.address;
      const txHash = event.tx.hash;
      const amount = event.outputs?.[0]?.amount.find(
        (a: { unit: string; quantity: string }) => a.unit === "lovelace"
      )?.quantity;
      if (wallet && amount) {
        upsertWallet(wallet);
        upsertTx(txHash, wallet, Number(amount), TX_STATUS.CONFIRMED);
      }
    }
  } catch (err) {
    console.error("Failed to handle webhook:", err);
  }
  return NextResponse.json({ ok: true });
}
