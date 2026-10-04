import { Buffer } from 'node:buffer';
import { secrets } from 'base44:runtime';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, TransactionInstruction, Transaction, SystemProgram } from 'npm:@solana/web3.js@1.98.4';
import { getSnsDomainKeySync, NAME_PROGRAM_ID, createInstruction, updateInstruction, transferInstruction, createReverse, getReverseKeyFromDomainKey, Numberu32, Numberu64 } from 'npm:@bonfida/spl-name-service@4.0.1';
import { assertNftStorageConfigured } from './pinata.ts';
import submitServerTransaction from './submitServerTransaction.ts';
export { default as mintIdentityNft } from './identityNft.ts';
import bs58 from 'npm:bs58@5.0.0';

export { NAME_PROGRAM_ID };
export const SNS_PARENT_DOMAIN = 'etherene.sns';
export function snsDomainName(domain, allowLegacy = false) {
  const name = typeof domain === 'string' ? domain.trim().toLowerCase() : '';
  if (!name) throw new Error('SNS domain name required.');
  if (name.endsWith('.sol') && !allowLegacy) throw new Error('SNS domains now use .sns. Enter the .sns name; .sol is a separate SRS namespace.');
  const trimmed = name.replace(/\.(sns|sol)$/, '');
  if (trimmed.split('.').some(label => !label)) throw new Error('Invalid SNS domain name.');
  return `${trimmed}.sns`;
}
// Only persisted SNS names and legacy mint receipts may use the old display suffix.
export function getDomainKeySync(domain) { return getSnsDomainKeySync(snsDomainName(domain, true).slice(0, -4)); }
export function solanaConnection() { return new Connection('https://solana-rpc.publicnode.com', 'confirmed'); }
export function parentDomainKey() { return getDomainKeySync(SNS_PARENT_DOMAIN).pubkey; }
export function serverKeypair() {
  const value = secrets.get('SOLANA_PAYER_PRIVATE_KEY');
  if (!value) throw new Error('Identity mint authority is not configured.');
  try {
    const key = value.trim().startsWith('[') ? Uint8Array.from(JSON.parse(value)) : bs58.decode(value.trim());
    return Keypair.fromSecretKey(key);
  } catch {
    throw new Error('The identity mint authority key is invalid. Update its secure configuration.');
  }
}
export async function mintSettings(base44) {
  const settings = (await base44.entities.GlobalSettings.list('-created_date', 1))[0];
  if (!settings?.admin_wallet) throw new Error('Mint payment wallet is not configured.');
  return settings;
}
export async function quoteMintFee(settings) {
  const feeUSD = Number(settings.platform_fee_usd ?? 3);
  if (!Number.isFinite(feeUSD) || feeUSD < 0) throw new Error('Invalid platform fee configuration.');
  if (feeUSD === 0) return { feeUSD, lamports: 0 };
  const response = await fetch('https://api.coinbase.com/v2/prices/SOL-USD/spot');
  const price = response.ok ? Number((await response.json()).data?.amount) : 0;
  if (!Number.isFinite(price) || price <= 0) throw new Error('SOL pricing is temporarily unavailable. Please try again before approving payment.');
  return { feeUSD, lamports: Math.ceil(feeUSD / price * LAMPORTS_PER_SOL) };
}
export function mintMemo(userId, subdomain, feeLamports) {
  return new TransactionInstruction({
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    keys: [], data: Buffer.from(JSON.stringify({ app: 'etherene-mint', userId, subdomain, feeLamports }))
  });
}
export function mintReceipt(transaction, userId) {
  for (const instruction of transaction.transaction.message.instructions) {
    if (instruction.programId?.toBase58() !== 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr') continue;
    let text = instruction.parsed;
    if (typeof text !== 'string' && instruction.data) text = Buffer.from(bs58.decode(instruction.data)).toString('utf8');
    try {
      const receipt = JSON.parse(text);
      if (receipt.app === 'etherene-mint' && receipt.userId === userId && /^node-[a-z0-9]+\.etherene\.(sns|sol)$/.test(receipt.subdomain) && Number.isSafeInteger(receipt.feeLamports) && receipt.feeLamports >= 0) return { ...receipt, subdomain: snsDomainName(receipt.subdomain, true) };
    } catch { /* Other memos are not mint receipts. */ }
  }
  return null;
}
export async function readRegistry(connection, domain) {
  const { pubkey } = getDomainKeySync(domain);
  const info = await connection.getAccountInfo(pubkey);
  if (!info || !info.owner.equals(NAME_PROGRAM_ID) || info.data.length < 96) throw new Error('Identity domain was not found on-chain.');
  return { pubkey, info, owner: new PublicKey(info.data.subarray(32, 64)) };
}
export async function ownedRegistry(connection, domain, address) {
  const registry = await readRegistry(connection, domain);
  if (!registry.owner.equals(new PublicKey(address))) throw new Error('The connected wallet does not own this identity domain.');
  return registry;
}

export async function mintReadiness(connection, authority, needsSubdomain = true) {
  assertNftStorageConfigured();
  const parent = await readRegistry(connection, SNS_PARENT_DOMAIN);
  const balance = await connection.getBalance(authority.publicKey, 'confirmed');
  const requiredSol = needsSubdomain ? 0.04 : 0.03;
  const reason = !parent.owner.equals(authority.publicKey)
    ? `Automatic minting requires the server signer to own ${SNS_PARENT_DOMAIN}. Parent owner: ${parent.owner.toBase58()}; server signer: ${authority.publicKey.toBase58()}. No new payment will be requested.`
    : balance < requiredSol * LAMPORTS_PER_SOL
      ? `Server mint wallet ${authority.publicKey.toBase58()} has ${(balance / LAMPORTS_PER_SOL).toFixed(5)} SOL. Fund it to at least ${requiredSol} SOL for subdomain registration and NFT rent. Do not pay the platform fee again.`
      : null;
  return { ready: !reason, reason, authorityAddress: authority.publicKey.toBase58(), parentOwner: parent.owner.toBase58(), balanceSol: balance / LAMPORTS_PER_SOL, requiredSol };
}

// Fund and configure with the server signer, then transfer ownership atomically.
export async function createSubdomain(connection, authority, subdomain, ownerAddress) {
  const label = subdomain.replace(/\.(sns|sol)$/, '').split('.')[0];
  const { pubkey, hashed } = getDomainKeySync(subdomain);
  const space = 1000;
  const rentLamports = await connection.getMinimumBalanceForRentExemption(space + 96);
  const parent = parentDomainKey();
  const owner = new PublicKey(ownerAddress);
  const transaction = new Transaction();
  transaction.feePayer = authority.publicKey;
  // createInstruction expects owner BEFORE payer; the user must never be payer here.
  transaction.add(createInstruction(NAME_PROGRAM_ID, SystemProgram.programId, pubkey, authority.publicKey, authority.publicKey, hashed, new Numberu64(rentLamports), new Numberu32(space), undefined, parent, authority.publicKey));
  transaction.add(updateInstruction(NAME_PROGRAM_ID, pubkey, new Numberu32(0), Buffer.from(label), authority.publicKey));
  const reverse = getReverseKeyFromDomainKey(pubkey, parent);
  if (!await connection.getAccountInfo(reverse)) transaction.add(...await createReverse(pubkey, `\0${label}`, authority.publicKey, parent, authority.publicKey));
  if (!owner.equals(authority.publicKey)) transaction.add(transferInstruction(NAME_PROGRAM_ID, pubkey, owner, authority.publicKey));
  const signature = await submitServerTransaction(connection, transaction, [authority]);
  return { signature, pubkey };
}

// SNS discovery reads the registrar's reverse account, not arbitrary domain data.
export async function ensureSubdomainLabel(connection, authority, subdomain) {
  const label = subdomain.replace(/\.(sns|sol)$/, '').split('.')[0];
  const { pubkey } = await readRegistry(connection, subdomain);
  const parent = parentDomainKey();
  const reverse = getReverseKeyFromDomainKey(pubkey, parent);
  if (await connection.getAccountInfo(reverse)) return { pubkey, corrected: false };
  const parentState = await readRegistry(connection, SNS_PARENT_DOMAIN);
  if (!parentState.owner.equals(authority.publicKey)) throw new Error('The server signer does not own the parent domain needed to register the SNS reverse lookup. Your payment is preserved.');
  const transaction = new Transaction();
  transaction.feePayer = authority.publicKey;
  transaction.add(...await createReverse(pubkey, `\0${label}`, authority.publicKey, parent, authority.publicKey));
  const signature = await submitServerTransaction(connection, transaction, [authority]);
  return { pubkey, corrected: true, signature };
}

export async function saveIdentity(base44, user, address, data) {
  const existing = (await base44.entities.Identity.filter({ address }))[0];
  if (existing && existing.created_by_id !== user.id && user.role !== 'admin') throw new Error('This wallet identity belongs to another app account.');
  if (existing?.banned) throw new Error('Identity suspended.');
  return existing ? await base44.entities.Identity.update(existing.id, data) : await base44.entities.Identity.create({ address, ...data });
}