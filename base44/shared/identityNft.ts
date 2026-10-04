import { Buffer } from 'node:buffer';
import { Keypair, PublicKey, Transaction, SystemProgram, ComputeBudgetProgram } from 'npm:@solana/web3.js@1.98.4';
import { MINT_SIZE, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createInitializeMintInstruction, createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync, createMintToInstruction, getMint, getAccount } from 'npm:@solana/spl-token@0.4.0';
import { createCreateMetadataAccountV3Instruction, createCreateMasterEditionV3Instruction, Metadata, PROGRAM_ID as METADATA_PROGRAM_ID } from 'npm:@metaplex-foundation/mpl-token-metadata@2.13.0';
import { pinataUploadFile, pinataUploadJson } from './pinata.ts';
import submitServerTransaction from './submitServerTransaction.ts';

export default async function mintIdentityNft(connection, authority, ownerAddress, imageUrl, subdomain, existingMintAddress) {
  const owner = new PublicKey(ownerAddress);
  // Derive a private, stable mint key so retries cannot issue duplicate NFTs.
  const seed = await crypto.subtle.digest('SHA-256', Buffer.concat([authority.secretKey, Buffer.from(`etherene-identity-nft:${ownerAddress}:${subdomain}`)]));
  const mint = Keypair.fromSeed(new Uint8Array(seed));
  const mintKey = existingMintAddress ? new PublicKey(existingMintAddress) : mint.publicKey;
  const ata = getAssociatedTokenAddressSync(mintKey, owner, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  const [metadataPda] = PublicKey.findProgramAddressSync([Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mintKey.toBuffer()], METADATA_PROGRAM_ID);
  const [editionPda] = PublicKey.findProgramAddressSync([Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mintKey.toBuffer(), Buffer.from('edition')], METADATA_PROGRAM_ID);
  const [mintInfo, metadataInfo, editionInfo] = await connection.getMultipleAccountsInfo([mintKey, metadataPda, editionPda], 'confirmed');
  let metadataUri;
  let imageUri;
  if (mintInfo) {
    const tokenMint = await getMint(connection, mintKey, 'confirmed');
    const token = await getAccount(connection, ata, 'confirmed');
    if (tokenMint.decimals !== 0 || tokenMint.supply !== 1n || token.amount !== 1n || !token.owner.equals(owner) || !metadataInfo?.owner.equals(METADATA_PROGRAM_ID)) throw new Error('Existing NFT ownership or metadata could not be verified. Your payment is preserved.');
    const metadata = Metadata.deserialize(metadataInfo.data)[0];
    if (!metadata.mint.equals(mintKey)) throw new Error('NFT metadata does not match its mint.');
    metadataUri = metadata.data.uri.replace(/\0/g, '');
    if (editionInfo?.owner.equals(METADATA_PROGRAM_ID) && editionInfo.data[0] === 6) return { mintAddress: mintKey.toBase58(), signature: null, metadataUri, imageUri: imageUrl };
    if (!tokenMint.mintAuthority?.equals(authority.publicKey)) throw new Error('The existing token cannot be finalized as an NFT by the server authority.');
  }
  const transaction = new Transaction();
  transaction.feePayer = authority.publicKey;
  transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }), ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
  if (!mintInfo) {
    imageUri = await pinataUploadFile(imageUrl);
    const metadata = { name: subdomain.slice(0, 32), symbol: 'ETHERENE', description: `Etherene on-chain identity node: ${subdomain}`, image: imageUri, external_url: `https://etherene.info/Profile?address=${ownerAddress}`, attributes: [{ trait_type: 'Subdomain', value: subdomain }, { trait_type: 'Network', value: 'Solana Mainnet' }, { trait_type: 'Protocol', value: 'Etherene' }], properties: { files: [{ uri: imageUri, type: 'image/png' }], category: 'image' } };
    metadataUri = await pinataUploadJson(metadata);
    const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
    transaction.add(SystemProgram.createAccount({ fromPubkey: authority.publicKey, newAccountPubkey: mintKey, space: MINT_SIZE, lamports, programId: TOKEN_PROGRAM_ID }));
    transaction.add(createInitializeMintInstruction(mintKey, 0, authority.publicKey, authority.publicKey, TOKEN_PROGRAM_ID));
    transaction.add(createAssociatedTokenAccountIdempotentInstruction(authority.publicKey, ata, owner, mintKey, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
    transaction.add(createMintToInstruction(mintKey, ata, authority.publicKey, 1, [], TOKEN_PROGRAM_ID));
    transaction.add(createCreateMetadataAccountV3Instruction(
      { metadata: metadataPda, mint: mintKey, mintAuthority: authority.publicKey, payer: authority.publicKey, updateAuthority: authority.publicKey },
      { createMetadataAccountArgsV3: { data: { name: metadata.name, symbol: metadata.symbol, uri: metadataUri, sellerFeeBasisPoints: 0, creators: null, collection: null, uses: null }, isMutable: true, collectionDetails: null } }
    ));
  }
  // A master edition makes this a wallet-recognizable, non-printable NFT and
  // removes the server's ability to mint more tokens from this mint.
  transaction.add(createCreateMasterEditionV3Instruction(
    { edition: editionPda, mint: mintKey, updateAuthority: authority.publicKey, mintAuthority: authority.publicKey, payer: authority.publicKey, metadata: metadataPda },
    { createMasterEditionArgs: { maxSupply: 0 } }
  ));
  const signature = await submitServerTransaction(connection, transaction, mintInfo ? [authority] : [authority, mint]);
  const [tokenMint, token, edition] = await Promise.all([getMint(connection, mintKey, 'confirmed'), getAccount(connection, ata, 'confirmed'), connection.getAccountInfo(editionPda, 'confirmed')]);
  if (tokenMint.decimals !== 0 || tokenMint.supply !== 1n || token.amount !== 1n || !token.owner.equals(owner) || !edition?.owner.equals(METADATA_PROGRAM_ID) || edition.data[0] !== 6) throw new Error('NFT delivery is not yet verified. Retry completion with the same payment.');
  return { mintAddress: mintKey.toBase58(), signature, metadataUri, imageUri };
}