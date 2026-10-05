import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { Buffer } from 'node:buffer';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, ComputeBudgetProgram } from 'npm:@solana/web3.js@1.98.4';
import { solanaConnection, SNS_PARENT_DOMAIN, serverKeypair, mintSettings, quoteMintFee, mintMemo, mintReadiness } from '../../shared/solanaIdentity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { userAddress, checkOnly = false } = await req.json();
    if (typeof userAddress !== 'string' || !userAddress.trim()) return Response.json({ error: 'Solana user address required' }, { status: 400 });
    let userPublicKey;
    try { userPublicKey = new PublicKey(userAddress.trim()); }
    catch { return Response.json({ error: 'Invalid Solana wallet address' }, { status: 400 }); }
    const address = userPublicKey.toBase58();
    const settings = await mintSettings(base44);
    const connection = solanaConnection();
    const authority = serverKeypair();
    const readiness = await mintReadiness(connection, authority);
    if (checkOnly) return Response.json({ success: true, ready: readiness.ready, reason: readiness.reason, maintenance: Boolean(settings.maintenance_mode) });
    if (settings.maintenance_mode) return Response.json({ error: 'Minting disabled for maintenance.' }, { status: 503 });
    if (!readiness.ready) return Response.json({ error: readiness.reason, readiness }, { status: 503 });
    const identity = (await base44.entities.Identity.filter({ address }))[0];
    if (identity?.banned) return Response.json({ error: 'Identity suspended.' }, { status: 403 });
    if (identity?.status === 'minted') return Response.json({ error: 'This wallet already has an identity. Use recovery instead of paying again.' }, { status: 409 });

    const manualQueue = false;
    const label = `node-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const subdomain = `${label}.${SNS_PARENT_DOMAIN}`;
    const { lamports, feeUSD } = await quoteMintFee(settings);
    const balance = await connection.getBalance(userPublicKey);
    const requiredFunds = lamports + 10000;
    if (balance < requiredFunds) return Response.json({ error: `Insufficient funds. Need ${(requiredFunds / LAMPORTS_PER_SOL).toFixed(4)} SOL (platform fee + network fees), but have ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL.` }, { status: 400 });

    // The user signs a payment-only transaction. The server creates the SNS
    // subdomain on-chain after confirming payment (server-side auto-mint).
    const transaction = new Transaction();
    transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }));
    if (lamports > 0) transaction.add(SystemProgram.transfer({ fromPubkey: userPublicKey, toPubkey: new PublicKey(settings.admin_wallet), lamports }));
    transaction.add(mintMemo(address, subdomain, lamports));
    // Image generation is deferred to requestMint (after payment confirmation) to
    // prevent anonymous callers from draining paid image-generation credits.
    const imageUrl = null;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.feePayer = userPublicKey;
    transaction.recentBlockhash = blockhash;
    return Response.json({ success: true, transaction: transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'), blockhash, lastValidBlockHeight, subdomain, imageUrl, manualQueue, feeAmount: lamports / LAMPORTS_PER_SOL, feeAmountUSD: feeUSD, rentAmount: 0 });
  } catch (error) {
    console.error('Mint preparation failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}