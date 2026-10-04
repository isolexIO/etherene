import bs58 from 'npm:bs58@5.0.0';

// Poll over HTTP. Never report success for a rejected or unconfirmed transaction.
export default async function submitServerTransaction(connection, transaction, signers) {
  const { context, value: { blockhash, lastValidBlockHeight } } = await connection.getLatestBlockhashAndContext('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.sign(...signers);
  const raw = transaction.serialize();
  const signature = bs58.encode(transaction.signature);
  try {
    await connection.sendRawTransaction(raw, { skipPreflight: false, preflightCommitment: 'confirmed', minContextSlot: context.slot, maxRetries: 5 });
  } catch (error) {
    console.warn('Server mint broadcast response:', error.message);
    if (error.name === 'SendTransactionError' || error.logs?.length || /simulation failed|signature verification failed|insufficient funds/i.test(error.message)) {
      throw new Error(`${error.message}${error.logs?.length ? ': ' + error.logs.slice(-6).join(' | ') : ''}`);
    }
    // A transport failure can occur after broadcast; keep checking this signature.
  }
  for (let attempt = 0; attempt < 30; attempt++) {
    const status = (await connection.getSignatureStatuses([signature], { searchTransactionHistory: true })).value[0];
    if (status?.err) throw new Error(`Server mint transaction failed: ${JSON.stringify(status.err)}`);
    if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') return signature;
    if (!status && !(await connection.isBlockhashValid(blockhash, { commitment: 'confirmed', minContextSlot: context.slot })).value) throw new Error('Server mint transaction expired. Retry completion using your existing payment.');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  const error = new Error('Server mint confirmation is pending. Retry completion using your existing payment.');
  error.mintPending = true;
  throw error;
}