import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Buffer } from "node:buffer";

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

import {
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram
} from 'npm:@solana/web3.js@^1.91.0';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountIdempotentInstruction
} from 'npm:@solana/spl-token@^0.4.0';
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as METADATA_PROGRAM_ID
} from 'npm:@metaplex-foundation/mpl-token-metadata@^2.13.0';
import bs58 from 'npm:bs58@5.0.0';
import { QUEST_CONCEPTS } from '../../shared/badgeArt.ts';

// Safe over-estimate of rent for an 82-byte mint account (~0.00147 SOL). The
// excess stays in the account as a rent-exempt buffer; under-funding fails the tx.
const MINT_RENT_LAMPORTS = 2_000_000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const origin = new URL(req.url).origin;
    const body = await req.json();
    let { questKey, userAddress, blockhash, lastValidBlockHeight } = body;

    if (!questKey || !userAddress || !blockhash) {
      return Response.json(
        { error: 'questKey, userAddress and blockhash are required' },
        { status: 400 }
      );
    }
    questKey = String(questKey);
    userAddress = String(userAddress).trim();

    // Access control: the server key is the mint authority + verified creator,
    // so only authenticated app users may drive a co-sign. An unauthenticated
    // caller (direct HTTP hit with no app session) must never reach partialSign.
    try {
      const caller = await base44.auth.me();
      if (!caller) throw new Error('no session');
    } catch {
      return Response.json(
        { error: 'Authentication required to mint a quest badge' },
        { status: 401 }
      );
    }

    // The quest must be one of the real Etherene daily quests — not arbitrary.
    if (!Object.prototype.hasOwnProperty.call(QUEST_CONCEPTS, questKey)) {
      return Response.json({ error: 'Unknown quest' }, { status: 400 });
    }

    let userPublicKey;
    try {
      userPublicKey = new PublicKey(userAddress);
    } catch {
      return Response.json({ error: 'Invalid user address' }, { status: 400 });
    }

    // One verified badge per quest per address per day — blocks repeat
    // co-signing abuse. Service role bypasses RLS so all records are visible.
    try {
      const today = new Date().toISOString().split('T')[0];
      const existing =
        await base44.asServiceRole.entities.QuestProgress.filter({
          address: userAddress,
          date: today,
          quest_key: questKey,
          completed: true,
        });
      if (existing && existing.length > 0) {
        return Response.json(
          { error: 'This quest badge has already been minted today' },
          { status: 409 }
        );
      }
    } catch {
      // non-fatal — don't block minting on a transient DB read error
    }

    // Respect global maintenance mode
    try {
      const settings = await base44.asServiceRole.entities.GlobalSettings.list();
      if (settings[0]?.maintenance_mode) {
        return Response.json({ error: 'Minting disabled for maintenance' }, { status: 503 });
      }
    } catch {
      // non-fatal
    }

    // Load the platform payer key (mint authority + verified creator)
    const pkStr = Deno.env.get("SOLANA_PAYER_PRIVATE_KEY");
    if (!pkStr) {
      return Response.json({ error: 'Server key not configured' }, { status: 500 });
    }
    let serverKeypair;
    try {
      const raw = pkStr.trim();
      let secret;
      if (raw.startsWith('[')) {
        secret = Uint8Array.from(JSON.parse(raw));
      } else if (/^[0-9a-fA-F]+$/.test(raw) && raw.length === 128) {
        secret = Uint8Array.from(Buffer.from(raw, 'hex'));
      } else {
        secret = bs58.decode(raw);
      }
      serverKeypair = Keypair.fromSecretKey(secret);
    } catch (e) {
      return Response.json({ error: 'Server key parse failed: ' + e.message }, { status: 500 });
    }

    // Fresh mint for this badge
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    const metadataPDA = PublicKey.findProgramAddressSync(
      [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      METADATA_PROGRAM_ID
    )[0];

    const ata = getAssociatedTokenAddressSync(
      mint,
      userPublicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const metadataUri =
      `${origin}/functions/questBadgeMetadata?quest=${encodeURIComponent(questKey)}&mint=${mint.toBase58()}`;

    const tx = new Transaction();
    tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));

    // 1. Create the mint account (user pays rent)
    tx.add(SystemProgram.createAccount({
      fromPubkey: userPublicKey,
      newAccountPubkey: mint,
      space: 82,
      lamports: MINT_RENT_LAMPORTS,
      programId: TOKEN_PROGRAM_ID,
    }));

    // 2. Initialise as a 0-decimal NFT mint, server as mint + freeze authority
    tx.add(createInitializeMintInstruction(
      mint,
      0,
      serverKeypair.publicKey,
      serverKeypair.publicKey,
      TOKEN_PROGRAM_ID
    ));

    // 3. Create the user's token account (idempotent)
    tx.add(createAssociatedTokenAccountIdempotentInstruction(
      userPublicKey,
      ata,
      userPublicKey,
      mint,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    ));

    // 4. Mint exactly 1 token to the user (server signs as mint authority)
    tx.add(createMintToInstruction(
      mint,
      ata,
      serverKeypair.publicKey,
      1,
      [],
      TOKEN_PROGRAM_ID
    ));

    // 5. Attach Metaplex metadata with the server as the verified creator
    tx.add(createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: mint,
        mintAuthority: serverKeypair.publicKey,
        payer: userPublicKey,
        updateAuthority: serverKeypair.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name: 'Etherene Quest Badge',
            symbol: 'ETHERENE',
            uri: metadataUri,
            sellerFeeBasisPoints: 0,
            creators: [{ address: serverKeypair.publicKey, verified: true, share: 100 }],
            collection: null,
            uses: null,
          },
          isMutable: true,
          collectionDetails: null,
        },
      },
      METADATA_PROGRAM_ID
    ));

    tx.feePayer = userPublicKey;
    tx.recentBlockhash = blockhash;
    if (typeof lastValidBlockHeight === 'number') {
      tx.lastValidBlockHeight = lastValidBlockHeight;
    }

    // Server signs as mint authority / update authority / verified creator;
    // the mint keypair signs for its own account creation. The user signs
    // afterwards (frontend) as fee payer + token account owner.
    tx.partialSign(serverKeypair, mintKeypair);

    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return Response.json({
      success: true,
      transaction: Buffer.from(serialized).toString('base64'),
      mintAddress: mint.toBase58(),
      metadataUri,
    });
  } catch (error) {
    console.error('mintQuestBadge error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}