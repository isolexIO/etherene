import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { Buffer } from 'node:buffer';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, ComputeBudgetProgram } from 'npm:@solana/web3.js@1.98.4';
import { NameRegistryState, createInstruction, updateInstruction, Numberu32, Numberu64 } from 'npm:@bonfida/spl-name-service@2.3.1';
import { solanaConnection, parentDomainKey, serverKeypair, mintSettings, quoteMintFee, mintMemo, getDomainKeySync, NAME_PROGRAM_ID } from '../../shared/solanaIdentity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in before minting your identity.' }, { status: 401 });
    const { userAddress } = await req.json();
    if (typeof userAddress !== 'string' || !userAddress.trim()) return Response.json({ error: 'Solana user address required' }, { status: 400 });
    let userPublicKey;
    try { userPublicKey = new PublicKey(userAddress.trim()); }
    catch { return Response.json({ error: 'Invalid Solana wallet address' }, { status: 400 }); }
    const address = userPublicKey.toBase58();
    const settings = await mintSettings(base44);
    if (settings.maintenance_mode) return Response.json({ error: 'Minting disabled for maintenance.' }, { status: 503 });
    const identity = (await base44.entities.Identity.filter({ address }))[0];
    if (identity?.banned) return Response.json({ error: 'Identity suspended.' }, { status: 403 });
    if (identity?.status === 'minted') return Response.json({ error: 'This wallet already has an identity. Use recovery instead of paying again.' }, { status: 409 });
    if (identity && identity.created_by_id !== user.id && user.role !== 'admin') return Response.json({ error: 'This identity belongs to another app account.' }, { status: 403 });

    const connection = solanaConnection();
    const authority = serverKeypair();
    const parent = parentDomainKey();
    const parentState = await NameRegistryState.retrieve(connection, parent);
    if (!parentState.registry?.owner) throw new Error('The etherene.sol parent domain is not registered.');
    const manualQueue = !parentState.registry.owner.equals(authority.publicKey);
    const label = `node-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const subdomain = `${label}.etherene.sol`;
    const { lamports, feeUSD } = await quoteMintFee(settings);
    const space = 1000;
    const rentLamports = manualQueue ? 0 : await connection.getMinimumBalanceForRentExemption(space + 96);
    const balance = await connection.getBalance(userPublicKey);
    const requiredFunds = lamports + rentLamports + 10000;
    if (balance < requiredFunds) return Response.json({ error: `Insufficient funds. Need ${(requiredFunds / LAMPORTS_PER_SOL).toFixed(4)} SOL (${(lamports / LAMPORTS_PER_SOL).toFixed(4)} platform fee + ${(rentLamports / LAMPORTS_PER_SOL).toFixed(4)} rent + network fees), but have ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL.` }, { status: 400 });

    const transaction = new Transaction();
    transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }));
    if (lamports > 0) transaction.add(SystemProgram.transfer({ fromPubkey: userPublicKey, toPubkey: new PublicKey(settings.admin_wallet), lamports }));
    transaction.add(mintMemo(user.id, subdomain, lamports));
    if (!manualQueue) {
      const { pubkey, hashed } = getDomainKeySync(subdomain);
      transaction.add(createInstruction(NAME_PROGRAM_ID, SystemProgram.programId, pubkey, userPublicKey, userPublicKey, hashed, new Numberu64(rentLamports), new Numberu32(space), undefined, parent, authority.publicKey));
      transaction.add(updateInstruction(NAME_PROGRAM_ID, pubkey, new Numberu32(0), Buffer.from(label), userPublicKey));
    }
    let imageUrl;
    try {
      imageUrl = (await base44.integrations.Core.GenerateImage({ prompt: `Abstract spiritual digital art, sacred geometry, Etherene node ${label}. Blue and purple cyberpunk mandala, no text.` })).url;
    } catch {
      imageUrl = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800&auto=format&fit=crop';
    }
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.feePayer = userPublicKey;
    transaction.recentBlockhash = blockhash;
    if (!manualQueue) transaction.partialSign(authority);
    return Response.json({ success: true, transaction: transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'), blockhash, lastValidBlockHeight, subdomain, imageUrl, manualQueue, feeAmount: lamports / LAMPORTS_PER_SOL, feeAmountUSD: feeUSD, rentAmount: rentLamports / LAMPORTS_PER_SOL });
  } catch (error) {
    console.error('Mint preparation failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}