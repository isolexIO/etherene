import { Buffer } from 'node:buffer';
import { secrets } from 'base44:runtime';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, TransactionInstruction } from 'npm:@solana/web3.js@1.98.4';
import { getSnsDomainKeySync, NAME_PROGRAM_ID } from 'npm:@bonfida/spl-name-service@4.0.1';
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
export async function saveIdentity(base44, user, address, data) {
  const existing = (await base44.entities.Identity.filter({ address }))[0];
  if (existing && existing.created_by_id !== user.id && user.role !== 'admin') throw new Error('This wallet identity belongs to another app account.');
  if (existing?.banned) throw new Error('Identity suspended.');
  return existing ? await base44.entities.Identity.update(existing.id, data) : await base44.entities.Identity.create({ address, ...data });
}