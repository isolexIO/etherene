import { base44 } from '@/api/base44Client';
import { Connection, VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

export default async function syncIdentityMint(pending) {
  if (pending.signedTransaction) {
    const connection = new Connection('https://solana-rpc.publicnode.com', 'confirmed');
    const status = (await connection.getSignatureStatuses([pending.paymentSignature], { searchTransactionHistory: true })).value[0];
    if (!status) {
      const raw = Buffer.from(pending.signedTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(raw);
      if ((await connection.isBlockhashValid(transaction.message.recentBlockhash)).value) await connection.sendRawTransaction(raw, { skipPreflight: false, preflightCommitment: 'confirmed' });
    }
  }
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await base44.functions.invoke('requestMint', pending);
      if (!response.data?.success) throw new Error(response.data?.error || 'Unable to sync your identity.');
      return response.data;
    } catch (error) {
      if ((!error.response?.data?.transactionPending && !error.response?.data?.mintPending) || attempt === 19) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}