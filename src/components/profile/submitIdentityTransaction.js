import { Connection, Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import encodeSolanaSignature from '@/components/profile/encodeSolanaSignature';

export default async function submitIdentityTransaction(result, signTransaction, onSubmitted, sendTransaction, awaitConfirmation = true) {
  const connection = new Connection('https://solana-rpc.publicnode.com', 'confirmed');
  const transaction = Transaction.from(Buffer.from(result.transaction, 'base64'));
  const authoritySignatures = transaction.signatures
    .filter(entry => entry.signature && !entry.publicKey.equals(transaction.feePayer))
    .map(entry => ({ publicKey: entry.publicKey, signature: Buffer.from(entry.signature) }));
  let validity = { blockhash: transaction.recentBlockhash, lastValidBlockHeight: result.lastValidBlockHeight };
  let signature;
  if (!authoritySignatures.length) {
    validity = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = validity.blockhash;
    transaction.signatures.forEach(entry => { entry.signature = null; });
  }
  if (signTransaction) {
    const message = Buffer.from(transaction.serializeMessage());
    // Keep the prepared message intact and preserve every server co-signature.
    let approved;
    try { approved = await signTransaction(transaction); }
    catch (error) { throw new Error(`Wallet signing failed: ${error.error?.message || error.cause?.message || error.message || 'Approval did not complete.'}`); }
    if (!approved) throw new Error('The wallet did not return an approved transaction.');
    const signed = approved instanceof Transaction
      ? approved
      : Transaction.from(Buffer.from(approved.serialize({ requireAllSignatures: false, verifySignatures: false })));
    if (!Buffer.from(signed.serializeMessage()).equals(message)) throw new Error('The wallet changed the mint transaction. Nothing was submitted; please reconnect and try again.');
    authoritySignatures.forEach(entry => signed.addSignature(entry.publicKey, entry.signature));
    if (!signed.verifySignatures()) throw new Error('Wallet approval did not produce a valid mint signature. Nothing was submitted; please reconnect and try again.');
    // Fully serialize BEFORE saving pending state, so a missing signature cannot
    // create a dead receipt. Preserve ambiguous transport failures to avoid double payment.
    const raw = signed.serialize();
    signature = encodeSolanaSignature(signed.signature);
    onSubmitted?.(signature, { ...validity, signedTransaction: Buffer.from(raw).toString('base64') });
    await connection.sendRawTransaction(raw, { skipPreflight: false, preflightCommitment: 'confirmed' });
  } else if (!authoritySignatures.length && sendTransaction) {
    signature = await sendTransaction(transaction, connection, { preflightCommitment: 'confirmed' });
    onSubmitted?.(signature, validity);
  } else {
    throw new Error('Reconnect a wallet that supports transaction signing.');
  }
  // Mint registration verifies confirmation server-side, without a browser WebSocket.
  if (!awaitConfirmation) return signature;
  const confirmation = await connection.confirmTransaction({ signature, ...validity }, 'confirmed');
  if (confirmation.value.err) {
    const error = new Error(`The transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`);
    error.transactionFailed = true;
    throw error;
  }
  return signature;
}