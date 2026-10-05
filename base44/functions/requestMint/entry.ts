import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PublicKey, LAMPORTS_PER_SOL } from 'npm:@solana/web3.js@1.98.4';
import { solanaConnection, mintSettings, quoteMintFee, mintReceipt, ownedRegistry, saveIdentity, getDomainKeySync, serverKeypair, createSubdomain, ensureSubdomainLabel, mintIdentityNft, mintReadiness } from '../../shared/solanaIdentity.ts';



export default async function(req) {
  let base44;
  let mintRequest;
  let identity;
  let stage = 'payment';
  try {
    base44 = createClientFromRequest(req);
    const { userAddress, paymentSignature, paymentBlockhash } = await req.json();
    if (!userAddress || !paymentSignature) return Response.json({ error: 'Missing wallet or transaction signature' }, { status: 400 });
    let address;
    try { address = new PublicKey(userAddress).toBase58(); }
    catch { return Response.json({ error: 'Invalid Solana wallet address' }, { status: 400 }); }
    const connection = solanaConnection();
    const tx = await connection.getParsedTransaction(paymentSignature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
    if (!tx?.meta) {
      const signatureStatus = (await connection.getSignatureStatuses([paymentSignature], { searchTransactionHistory: true })).value[0];
      if (signatureStatus?.err) return Response.json({ error: 'The payment failed on-chain. You can retry minting.', transactionFailed: true }, { status: 400 });
      if (!signatureStatus && typeof paymentBlockhash === 'string' && !(await connection.isBlockhashValid(paymentBlockhash, 'confirmed')).value) return Response.json({ error: 'The payment expired without confirmation. You can prepare a fresh mint.', transactionExpired: true }, { status: 409 });
      return Response.json({ error: 'Payment confirmation is still being indexed. Retry without paying again.', transactionPending: true }, { status: 409 });
    }
    if (tx.meta.err) return Response.json({ error: 'The payment failed on-chain. No identity was minted.', transactionFailed: true }, { status: 400 });
    if (!tx.transaction.message.accountKeys.some(key => key.signer && key.pubkey.toBase58() === address)) return Response.json({ error: 'The wallet did not sign this payment.' }, { status: 403 });
    const receipt = mintReceipt(tx, address);
    if (!receipt) return Response.json({ error: 'This transaction is not a mint payment for your wallet.' }, { status: 403 });
    const existingRequest = (await base44.asServiceRole.entities.MintRequest.filter({ payment_signature: paymentSignature }))[0];
    if (existingRequest && (existingRequest.user_address !== address || existingRequest.subdomain !== receipt.subdomain)) return Response.json({ error: 'This payment belongs to a different mint request.' }, { status: 409 });
    const existingIdentity = (await base44.entities.Identity.filter({ address }))[0];
    if (existingIdentity?.banned) return Response.json({ error: 'Identity suspended.' }, { status: 403 });
    if (existingIdentity?.nft_mint_address && existingIdentity.subdomain !== receipt.subdomain) return Response.json({ error: 'This wallet already has a completed identity. Sync its original payment instead of another mint.' }, { status: 409 });
    const settings = await mintSettings(base44);
    const paid = tx.transaction.message.instructions.filter(ix => ix.program === 'system' && ix.parsed?.type === 'transfer' && ix.parsed.info.source === address && ix.parsed.info.destination === settings.admin_wallet).reduce((sum, ix) => sum + Number(ix.parsed.info.lamports), 0);
    // Verify payment BEFORE spending server funds or creating any blockchain accounts.
    // Never trust the client-controlled memo (receipt.feeLamports) for the expected
    // fee — always derive it from the server-side settings quote.
    const expected = (await quoteMintFee(settings)).lamports;
    if (paid < expected * 0.95 || (Number(settings.platform_fee_usd) > 0 && paid <= 0)) return Response.json({ error: 'The required platform payment is missing.' }, { status: 400 });
    // Never accept a caller-supplied image URL — an attacker replaying a public
    // on-chain payment could inject an arbitrary image into the victim's profile.
    // The image is always sourced from an existing request/identity or generated
    // server-side after payment confirmation.
    let image = existingRequest?.image_url || (existingIdentity?.subdomain === receipt.subdomain ? existingIdentity.avatar_url : null) || null;
    const requestData = { user_address: address, subdomain: receipt.subdomain, payment_signature: paymentSignature, amount_paid_sol: paid / LAMPORTS_PER_SOL, status: 'processing', image_url: typeof image === 'string' ? image : '', bio: existingIdentity?.bio || '' };
    // Persist the paid request before the subdomain/NFT steps; all retries resume it.
    mintRequest = existingRequest ? await base44.asServiceRole.entities.MintRequest.update(existingRequest.id, requestData) : await base44.asServiceRole.entities.MintRequest.create(requestData);
    const authority = serverKeypair();
    const registry = await connection.getAccountInfo(getDomainKeySync(receipt.subdomain).pubkey);
    const savedNft = existingIdentity?.subdomain === receipt.subdomain ? existingIdentity.nft_mint_address : null;
    if (!registry || !savedNft) {
      const readiness = await mintReadiness(connection, authority, !registry);
      if (!readiness.ready) throw new Error(readiness.reason);
    }
    stage = 'subdomain';
    let serverMintSignature = null;
    if (!registry) serverMintSignature = (await createSubdomain(connection, authority, receipt.subdomain, address)).signature;
    await ownedRegistry(connection, receipt.subdomain, address);
    const reverse = await ensureSubdomainLabel(connection, authority, receipt.subdomain);
    serverMintSignature ||= reverse.signature || null;
    if (typeof image !== 'string' || !image.startsWith('https://')) {
      // Derive a unique palette + motif from the wallet address so every
      // identity image is visually distinct (no two wallets share a look).
      const addrHash = Array.from(address).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
      const hueA = addrHash % 360;
      const hueB = (hueA + 120 + (addrHash >> 8) % 120) % 360;
      const motifs = ['sacred geometry mandala', 'fractal lotus bloom', 'cyberpunk sigil circle', 'neural constellation map', 'crystalline ether lattice', 'orbital node diagram'];
      const motif = motifs[addrHash % motifs.length];
      const palette = `dominant hue ${hueA}° with complementary ${hueB}°`;
      image = (await base44.integrations.Core.GenerateImage({
        prompt: `Abstract spiritual digital art, ${motif}, unique Etherene identity node ${receipt.subdomain} for wallet ${address.slice(0, 6)}…${address.slice(-4)}. ${palette}, deep cosmic background, intricate symmetric sacred geometry, luminous energy, no text, no letters, no words.`
      })).url;
      await base44.asServiceRole.entities.MintRequest.update(mintRequest.id, { image_url: image });
    }
    identity = await saveIdentity(base44, address, { subdomain: receipt.subdomain, network: 'Solana Mainnet', status: 'minted', fee_charged: true, avatar_url: image, cover_image: image });
    stage = 'nft';
    const nft = await mintIdentityNft(connection, authority, address, image, receipt.subdomain, savedNft);
    identity = await saveIdentity(base44, address, { nft_mint_address: nft.mintAddress });
    await base44.asServiceRole.entities.MintRequest.update(mintRequest.id, { status: 'minted', image_url: identity.avatar_url || image });
    return Response.json({ success: true, status: 'minted', subdomain: receipt.subdomain, identity, requestId: mintRequest.id, serverMintSignature, nftMintAddress: nft.mintAddress, nftSignature: nft.signature, nftMetadataUri: nft.metadataUri, message: 'Subdomain registered and identity NFT delivered to your wallet.' });
  } catch (error) {
    console.error(`Identity ${stage} step failed:`, error.message);
    const rateLimited = /429|rate limit exceeded|too many requests/i.test(error.message);
    const mintPending = Boolean(error.mintPending || rateLimited);
    const message = rateLimited ? 'Blockchain delivery is temporarily busy. Completion will retry using your confirmed payment.' : error.message;
    return Response.json({ error: `${stage === 'nft' ? 'NFT delivery failed: ' : ''}${message}`, paymentConfirmed: Boolean(mintRequest), stage, identity, requestId: mintRequest?.id, mintPending }, { status: mintPending ? 409 : 500 });
  }
}