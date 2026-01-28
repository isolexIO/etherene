import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Buffer } from "node:buffer";

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

import { Connection, PublicKey, LAMPORTS_PER_SOL } from 'npm:@solana/web3.js@^1.91.0';



Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { userAddress, paymentSignature } = body;

        if (!userAddress || !paymentSignature) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch global settings
        const settings = await base44.asServiceRole.entities.GlobalSettings.list();
        if (!settings || settings.length === 0) {
            return Response.json({ error: 'Global settings not configured' }, { status: 500 });
        }
        const { platform_fee_usd, admin_wallet } = settings[0];

        if (!admin_wallet) {
            return Response.json({ error: 'Admin wallet not configured' }, { status: 500 });
        }

        // Validate user address
        let userPublicKey;
        try {
            userPublicKey = new PublicKey(userAddress);
        } catch (e) {
            return Response.json({ error: 'Invalid user address' }, { status: 400 });
        }

        // Verify payment transaction
        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        
        let transaction;
        try {
            transaction = await connection.getTransaction(paymentSignature, {
                maxSupportedTransactionVersion: 0
            });
        } catch (e) {
            return Response.json({ error: 'Failed to verify payment transaction' }, { status: 400 });
        }

        if (!transaction) {
            return Response.json({ error: 'Payment transaction not found' }, { status: 400 });
        }

        // Verify payment details
        const adminPubkey = new PublicKey(admin_wallet);
        if (!transaction.meta) {
            return Response.json({ error: 'Transaction metadata not available' }, { status: 400 });
        }

        const preBalances = transaction.meta.preBalances;
        const postBalances = transaction.meta.postBalances;
        
        // Handle both versioned and legacy transactions
        let accountKeys;
        if (transaction.transaction.message.getAccountKeys) {
            accountKeys = transaction.transaction.message.getAccountKeys();
        } else if (transaction.transaction.message.accountKeys) {
            accountKeys = {
                get: (index) => transaction.transaction.message.accountKeys[index],
                length: transaction.transaction.message.accountKeys.length
            };
        } else {
            return Response.json({ error: 'Unable to read transaction account keys' }, { status: 400 });
        }

        let paymentFound = false;
        let amountPaid = 0;

        const keyCount = accountKeys.length || (transaction.transaction.message.accountKeys?.length || 0);
        for (let i = 0; i < keyCount; i++) {
            const key = accountKeys.get ? accountKeys.get(i) : accountKeys[i];
            if (key.equals(adminPubkey)) {
                const balanceChange = postBalances[i] - preBalances[i];
                if (balanceChange > 0) {
                    amountPaid = balanceChange / LAMPORTS_PER_SOL;
                    paymentFound = true;
                    break;
                }
            }
        }

        if (!paymentFound) {
            return Response.json({ error: 'Payment to admin wallet not found in transaction' }, { status: 400 });
        }

        // Get SOL price and verify amount
        let solPrice = 200; // fallback
        try {
            const priceReq = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await priceReq.json();
            if (data.solana?.usd) solPrice = data.solana.usd;
        } catch (e) {
            console.error("Price fetch failed:", e);
        }

        const paidUSD = amountPaid * solPrice;
        if (paidUSD < platform_fee_usd * 0.95) { // 5% tolerance
            return Response.json({ 
                error: `Insufficient payment. Required: $${platform_fee_usd}, Received: $${paidUSD.toFixed(2)}` 
            }, { status: 400 });
        }

        // Generate subdomain
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const subdomain = `node-${randomSuffix}.etherene.sol`;

        // Fetch user context for AI image
        const identities = await base44.asServiceRole.entities.Identity.filter({ address: userAddress });
        const bio = identities[0]?.bio || `Etherene Node ${subdomain}`;
        const prompt = `Abstract spiritual digital art, sacred geometry, node ${subdomain}, ${bio}. Cyberpunk, 8k, blue purple.`;
        
        let imageRes;
        try {
            imageRes = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
        } catch (e) {
            imageRes = { url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop" };
        }

        // Create mint request record
        const mintRequest = await base44.asServiceRole.entities.MintRequest.create({
            user_address: userAddress,
            subdomain,
            payment_signature: paymentSignature,
            amount_paid_sol: amountPaid,
            status: 'pending',
            image_url: imageRes.url,
            bio
        });

        // Get admin email
        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        const adminEmail = admins[0]?.email;

        // Send email notification to admin
        if (adminEmail) {
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: adminEmail,
                    subject: `New Mint Request: ${subdomain}`,
                    body: `
New identity mint request received!

User Address: ${userAddress}
Subdomain: ${subdomain}
Payment: ${amountPaid.toFixed(4)} SOL (~$${paidUSD.toFixed(2)} USD)
Transaction: https://explorer.solana.com/tx/${paymentSignature}

Avatar Image: ${imageRes.url}

Please mint this subdomain manually on the Solana Name Service.
Request ID: ${mintRequest.id}
                    `
                });
            } catch (e) {
                console.error("Email failed:", e);
            }
        }

        return Response.json({
            success: true,
            subdomain,
            imageUrl: imageRes.url,
            requestId: mintRequest.id,
            message: 'Payment received! Your identity will be minted within 24 hours.'
        });

    } catch (error) {
        console.error("Request mint error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});