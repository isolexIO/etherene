import { Connection, Transaction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import encodeSolanaSignature from '@/components/profile/encodeSolanaSignature';
import submitIdentityTransaction from '@/components/profile/submitIdentityTransaction';

export default async function submitMintPayment(result, walletContext, onSubmitted) {
  const { wallet, publicKey, signTransaction, sendTransaction } = walletContext;
  if (!wallet?.adapter.supportedTransactionVersions?.has(0)) {
    return submitIdentityTransaction(result, signTransaction, onSubmitted, sendTransaction, false);
  }
  const connection = new Connection('https://solana-rpc.publicnode.com', 'confirmed');
  const prepared = Transaction.from(Buffer.from(result.transaction, 'base64'));
  if (!prepared.feePayer?.equals(publicKey)) throw new Error('Reconnect the wallet used to prepare this payment.');
  if (prepared.signatures.some(entry => entry.signature)) throw new Error('A mint payment must not contain server signatures.');
  const validity = await connection.getLatestBlockhash('confirmed');
  // Compile a real v0 message, not a versioned wrapper around a legacy message.
  // Keep this format through wallet approval, submission, and receipt recovery.
  const transaction = new VersionedTransaction(new TransactionMessage({
    payerKey: publicKey, recentBlockhash: validity.blockhash, instructions: prepared.instructions,
  }).compileToV0Message());
  if (transaction.message.header.numRequiredSignatures !== 1) throw new Error('The payment unexpectedly requires another signer.');
  const message = Buffer.from(transaction.message.serialize());
  if (!signTransaction) {
    const signature = await sendTransaction(transaction, connection, { skipPreflight: false, preflightCommitment: 'confirmed' });
    onSubmitted?.(signature, validity);
    return signature;
  }
  let approved;
  try { approved = await signTransaction(transaction); }
  catch (error) { throw new Error(`Wallet signing failed: ${error.error?.message || error.cause?.message || error.message || 'Approval did not complete.'}`); }
  if (!approved) throw new Error('The wallet did not return an approved payment.');
  const signed = VersionedTransaction.deserialize(approved.serialize({ requireAllSignatures: false, verifySignatures: false }));
  if (signed.version !== 0 || !Buffer.from(signed.message.serialize()).equals(message)) throw new Error('The wallet changed the payment. Nothing was submitted.');
  if (signed.signatures.some(bytes => bytes.length !== 64 || !bytes.some(byte => byte !== 0))) throw new Error('The wallet returned an unsigned payment. Nothing was submitted.');
  const raw = signed.serialize();
  const signature = encodeSolanaSignature(signed.signatures[0]);
  onSubmitted?.(signature, { ...validity, signedTransaction: Buffer.from(raw).toString('base64') });
  // RPC preflight verifies the signature against the unchanged v0 message.
  await connection.sendRawTransaction(raw, { skipPreflight: false, preflightCommitment: 'confirmed' });
  return signature;
}