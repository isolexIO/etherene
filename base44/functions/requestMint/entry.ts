import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { PublicKey, LAMPORTS_PER_SOL } from 'npm:@solana/web3.js@1.98.4';
import { solanaConnection, mintSettings, quoteMintFee, mintReceipt, ownedRegistry, saveIdentity, getDomainKeySync, NAME_PROGRAM_ID, serverKeypair, readRegistry, createSubdomain, ensureSubdomainLabel, SNS_PARENT_DOMAIN } from '../../shared/solanaIdentity.ts';



export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
    const { userAddress, paymentSignature, imageUrl, lastValidBlockHeight } = await req.json();
    if (!userAddress || !paymentSignature) return Response.json({ error: 'Missing wallet or transaction signature' }, { status: 400 });
    let address;
    try { address = new PublicKey(userAddress).toBase58(); }
    catch { return Response.json({ error: 'Invalid Solana wallet address' }, { status: 400 }); }
    const connection = solanaConnection();
    const tx = await connection.getParsedTransaction(paymentSignature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
    if (!tx?.meta) {
      const signatureStatus = (await connection.getSignatureStatuses([paymentSignature], { searchTransactionHistory: true })).value[0];
      if (signatureStatus?.err) return Response.json({ error: 'The transaction failed on-chain. You can retry minting.', transactionFailed: true }, { status: 400 });
      if (!signatureStatus && Number.isSafeInteger(lastValidBlockHeight) && await connection.getBlockHeight('confirmed') > lastValidBlockHeight) return Response.json({ error: 'The transaction expired without confirmation. You can prepare a fresh mint.', transactionExpired: true }, { status: 409 });
      return Response.json({ error: 'Transaction confirmation is still being indexed. Retry syncing this signature without paying again.', transactionPending: true }, { status: 409 });
    }
    if (tx.meta.err) return Response.json({ error: 'The transaction failed on-chain. No identity was minted.', transactionFailed: true }, { status: 400 });
    const keys = tx.transaction.message.accountKeys;
    if (!keys.some(key => key.signer && key.pubkey.toBase58() === address)) return Response.json({ error: 'The wallet did not sign this transaction.' }, { status: 403 });
    const receipt = mintReceipt(tx, user.id);
    if (!receipt) return Response.json({ error: 'This transaction is not a mint request for your signed-in account. Use identity recovery for older transactions.' }, { status: 403 });
    const existingRequest = (await base44.asServiceRole.entities.MintRequest.filter({ payment_signature: paymentSignature }))[0];
    if (existingRequest && existingRequest.created_by_id !== user.id) return Response.json({ error: 'This transaction has already been claimed.' }, { status: 409 });
    const settings = await mintSettings(base44);
    const instructions = tx.transaction.message.instructions;
    const paid = instructions.filter(ix => ix.program === 'system' && ix.parsed?.type === 'transfer' && ix.parsed.info.source === address && ix.parsed.info.destination === settings.admin_wallet).reduce((total, ix) => total + Number(ix.parsed.info.lamports), 0);
    const registryKey = getDomainKeySync(receipt.subdomain).pubkey;
    const automaticMint = instructions.some(ix => ix.programId?.equals(NAME_PROGRAM_ID)) && keys.some(key => key.pubkey.equals(registryKey));
    const registryInfo = !automaticMint ? await connection.getAccountInfo(registryKey) : null;
    let minted = automaticMint || Boolean(registryInfo?.owner?.equals(NAME_PROGRAM_ID));
    let serverMintSignature = null;
    if (minted) {
      if (automaticMint && !keys.some(key => key.signer && key.pubkey.equals(serverKeypair().publicKey))) return Response.json({ error: 'Mint authority signature missing.' }, { status: 403 });
      await ownedRegistry(connection, receipt.subdomain, address);
      // Correct the stored label if a prior mint wrote the wrong value.
      await ensureSubdomainLabel(connection, serverKeypair(), receipt.subdomain);
    } else {
      // Server-side auto-mint: create the SNS subdomain on-chain using the parent authority.
      const authority = serverKeypair();
      const parentState = await readRegistry(connection, SNS_PARENT_DOMAIN);
      if (parentState.owner.equals(authority.publicKey)) {
        const created = await createSubdomain(connection, authority, receipt.subdomain, address);
        await ownedRegistry(connection, receipt.subdomain, address);
        serverMintSignature = created.signature;
        minted = true;
      }
    }
    const expected = minted || existingRequest ? receipt.feeLamports : (await quoteMintFee(settings)).lamports;
    if (paid < expected * 0.95 || paid < receipt.feeLamports) return Response.json({ error: 'The required platform payment is missing from this transaction.' }, { status: 400 });
    const status = minted ? 'minted' : 'pending';
    const data = { subdomain: receipt.subdomain, network: 'Solana Mainnet', status: minted ? 'minted' : 'declared', fee_charged: true };
    if (typeof imageUrl === 'string' && imageUrl.startsWith('https://')) Object.assign(data, { avatar_url: imageUrl, cover_image: imageUrl });
    const identity = await saveIdentity(base44, user, address, data);
    const requestData = { user_address: address, subdomain: receipt.subdomain, payment_signature: paymentSignature, amount_paid_sol: paid / LAMPORTS_PER_SOL, status, image_url: identity.avatar_url || '', bio: identity.bio || '' };
    const mintRequest = existingRequest ? await base44.asServiceRole.entities.MintRequest.update(existingRequest.id, requestData) : await base44.entities.MintRequest.create(requestData);
    if (!minted && !existingRequest) {
      waitUntil((async () => {
        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        if (admins[0]?.email) await base44.asServiceRole.integrations.Core.SendEmail({ to: admins[0].email, template_name: 'MintRequestNotice', variables: { subdomain: receipt.subdomain, user_address: address, amount_sol: (paid / LAMPORTS_PER_SOL).toFixed(4), request_id: mintRequest.id } });
      })().catch(error => console.error('Manual mint notice failed:', error.message)));
    }
    return Response.json({ success: true, subdomain: receipt.subdomain, imageUrl: identity.avatar_url, identity, requestId: mintRequest.id, status, serverMintSignature, message: minted ? 'Identity minted and verified on-chain.' : 'Payment confirmed. Your identity is queued for manual minting.' });
  } catch (error) {
    console.error('Mint confirmation failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}