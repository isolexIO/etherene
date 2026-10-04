import { Connection, Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

export default async function submitIdentityTransaction(result, signTransaction, onSubmitted, sendTransaction) {
  const connection = new Connection('https://solana-rpc.publicnode.com', 'confirmed');
  const transaction = Transaction.from(Buffer.from(result.transaction, 'base64'));
  const authoritySignatures = transaction.signatures
    .filter(entry => entry.signature && !entry.publicKey.equals(transaction.feePayer))
    .map(entry => ({ publicKey: entry.publicKey, signature: Buffer.from(entry.signature) }));
  let validity = { blockhash: transaction.recentBlockhash, lastValidBlockHeight: result.lastValidBlockHeight };
  let signature;
  if (!authoritySignatures.length && sendTransaction) {
    // Wallet-only transactions can use the wallet's native approve-and-submit flow.
    validity = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = validity.blockhash;
    transaction.signatures.forEach(entry => { entry.signature = null; });
    signature = await sendTransaction(transaction, connection, { preflightCommitment: 'confirmed' });
  } else {
    if (!signTransaction) throw new Error('Reconnect a wallet that supports transaction signing.');
    const message = Buffer.from(transaction.serializeMessage());
    const signed = await signTransaction(transaction);
    if (!signed || !Buffer.from(signed.serializeMessage()).equals(message)) {
      throw new Error('The wallet changed the mint transaction. Nothing was submitted; please reconnect and try again.');
    }
    // Some wallets return only their own signature. Retain the parent's approval.
    authoritySignatures.forEach(entry => signed.addSignature(entry.publicKey, entry.signature));
    if (!signed.verifySignatures()) throw new Error('Wallet approval did not produce a valid mint signature. Nothing was submitted; please reconnect and try again.');
    signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, preflightCommitment: 'confirmed' });
  }
  onSubmitted?.(signature, validity);
  const confirmation = await connection.confirmTransaction({ signature, ...validity }, 'confirmed');
  if (confirmation.value.err) {
    const error = new Error(`The transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`);
    error.transactionFailed = true;
    throw error;
  }
  return signature;
}