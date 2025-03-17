'use server'

import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });
    
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  }
  
  return redisClient;
}

// Define an interface for the transaction data
export interface CardanoTransaction {
  hash: string;
  complete: string;
  stripped: string;
  witnessSet: string;
  auxiliaryData: string;
}

export async function storeTransaction(txHash: string, txData: CardanoTransaction, expirySeconds = 300) {
  try {
    const client = await getRedisClient();
    await client.set(txHash, JSON.stringify(txData), {
      EX: expirySeconds,
      NX: true,
    });
    return true;
  } catch (error) {
    console.error('Error storing transaction:', error);
    return false;
  }
}

export async function getTransaction(txHash: string) {
  try {
    const client = await getRedisClient();
    const data = await client.get(txHash);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving transaction:', error);
    return null;
  }
}

export async function removeTransaction(txHash: string) {
  try {
    const client = await getRedisClient();
    await client.del(txHash);
    return true;
  } catch (error) {
    console.error('Error removing transaction:', error);
    return false;
  }
}