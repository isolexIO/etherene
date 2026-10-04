import { Connection, Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

export default async function submitIdentityTransaction(result, signTransaction, onSubmitted) {
  if (!signTransaction) throw new Error('Reconnect a wallet that supports transaction signing.');
  const connection = new Connection('https://solana-rpc.publicnode.com', 'confirmed');
  const transaction = Transaction.from(Buffer.from(result.transaction, 'base64'));
  const signed = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  onSubmitted?.(signature);
  const confirmation = await connection.confirmTransaction({
    signature, blockhash: transaction.recentBlockhash, lastValidBlockHeight: result.lastValidBlockHeight
  }, 'confirmed');
  if (confirmation.value.err) {
    const error = new Error(`The transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`);
    error.transactionFailed = true;
    throw error;
  }
  return signature;
}