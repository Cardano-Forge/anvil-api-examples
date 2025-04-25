import Database from "better-sqlite3";
import dotenv from "dotenv";
import { TransactionStatus } from './types';

dotenv.config();
const db = new Database(process.env.SQLITE_DB_PATH!);

db.exec(`
  CREATE TABLE IF NOT EXISTS wallets(
    address TEXT PRIMARY KEY
  );
  CREATE TABLE IF NOT EXISTS transactions(
    txHash TEXT PRIMARY KEY,
    wallet TEXT,
    amount INTEGER,
    status TEXT,
    timestamp INTEGER
  );
`);

export function upsertWallet(address: string) {
  db.prepare(`INSERT OR IGNORE INTO wallets(address) VALUES (?)`).run(address);
}

export function upsertTx(
  txHash: string,
  wallet: string,
  amount: number,
  status: TransactionStatus
) {
  db.prepare(
    `INSERT OR REPLACE INTO transactions(
       txHash, wallet, amount, status, timestamp
     ) VALUES (?, ?, ?, ?, ?)`
  ).run(txHash, wallet, amount, status, Date.now());
}

export function getTxsByWallet(wallet: string) {
  return db
    .prepare(`SELECT * FROM transactions WHERE wallet = ? ORDER BY timestamp DESC`)
    .all(wallet);
}

// Update the status of an existing transaction record
export function updateTxStatus(
  txHash: string,
  status: TransactionStatus
) {
  db.prepare(
    `UPDATE transactions SET status = ?, timestamp = ? WHERE txHash = ?`
  ).run(status, Date.now(), txHash);
}