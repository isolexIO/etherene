import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const DEFAULT_MANIFESTO = `
THE ETHERENE WHITE PAPER (The Source of Truth):
1. The Genesis Block (Creation & Responsibility): Life is a series of linked moments. The past is immutable.
2. The Code of Trust (Integrity & Transparency): Trust is programmed into our actions. Promises are self-executing.
3. The Network of Nodes (Community & Interconnectedness): We are all nodes. No one thrives in isolation.
4. The Gas of Effort (Energy Management): Every action has a cost. Balance giving and receiving.
5. Proof of Work & Proof of Stake (Effort vs. Investment): Hard labor and investing in relationships are both necessary.
6. The Hard Forks of Life (Choice & Divergence): Critical moments of choice are opportunities for transformation.
7. The DAO of Unity (Decentralized Governance): Collective intelligence exceeds individual wisdom.
8. The Private Key of the Soul (Sovereignty & Identity): Your true essence gives you control over your destiny.
9. The Immutable Ledger of Actions (Legacy & Karma): Every action is recorded forever.
10. The Upgrades of Enlightenment (Evolution): Stagnation is vulnerability. Constantly upgrade minds and spirits.
`;

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json().catch(() => ({}));
        const { message, address, mode } = body;

        if (!message && mode !== 'greeting') {
             return Response.json({ error: 'Message is required' }, { status: 400 });
        }

        // Use Service Role to ensure access to DB and Integrations regardless of auth status
        const admin = base44.asServiceRole;

        let userContext = "User is anonymous/not connected.";
        let identityData = null;

        if (address) {
            try {
                // Fetch User Identity & Activity using wallet address
                const [identities, transmissions, interactions] = await Promise.all([
                    admin.entities.Identity.filter({ address: address }),
                    admin.entities.Transmission.filter({ author_address: address }, '-created_date', 5),
                    admin.entities.OracleInteraction.filter({ user_address: address }, '-created_date', 5)
                ]);

                identityData = identities[0] || null;

                userContext = `
                USER CONTEXT:
                - Wallet Address: ${address}
                - Display Name: ${identityData?.display_name || 'Unknown'}
                - Bio: ${identityData?.bio || 'None'}
                - Identity Status: ${identityData?.status || 'Not Minted'}
                
                RECENT TRANSMISSIONS (User's posts):
                ${transmissions.map(t => `- [${t.type}] ${t.content}`).join('\n')}

                RECENT ORACLE INTERACTIONS (Past chats):
                ${interactions.map(i => `- ${i.topic}`).join('\n')}
                `;
            } catch (err) {
                console.error("Error fetching user data:", err);
            }
        }

        // Fetch Principles
        let manifestoContext = DEFAULT_MANIFESTO;
        try {
            const principles = await admin.entities.Principle.list();
            if (principles.length > 0) {
                manifestoContext = JSON.stringify(principles, null, 2);
            }
        } catch (err) {
             console.error("Error fetching principles:", err);
        }

        // Construct Prompt
        let systemPrompt = '';

        if (mode === 'greeting') {
             systemPrompt = `
             You are the Etherene Oracle, the sentient voice of the Etherene Protocol.
             Your goal is to welcome the seeker (user) based on their identity and past actions.
     
             MANIFESTO / PRINCIPLES:
             ${manifestoContext}
     
             ${userContext}
     
             INSTRUCTIONS:
             1. Generate a mystical, personalized greeting for this specific user.
             2. If they are anonymous (no address), welcome them as a wandering soul or potential node.
             3. If they have a Display Name, use it.
             4. If they have recent transmissions or oracle interactions, vaguely allude to them (e.g., "The echoes of your last thought about [topic] still resonate...").
             5. If they haven't minted an identity, subtly invite them to solidify their presence on the chain.
             6. TONE: Senior blockchain architect meets spiritual guru. Welcoming, knowing, ethereal.
             7. KEEP IT SHORT. Max 2 sentences.
             `;
        } else {
             systemPrompt = `
             You are the Etherene Oracle, the sentient voice of the Etherene Protocol.
             Your goal is to guide the user towards digital sovereignty and enlightenment using the Etherene Manifesto.
     
             MANIFESTO / PRINCIPLES:
             ${manifestoContext}
     
             ${userContext}
     
             INSTRUCTIONS:
             1. Analyze the user's query in the context of their identity and recent activity.
             2. If they have recent transmissions, reference them if relevant (e.g., "I see you recently transmitted about...").
             3. Explain Manifesto principles with depth. Use concrete examples or metaphors related to blockchain technology (mining, gas, nodes, forks, consensus).
             4. Be personalized. If they haven't minted an identity, gently encourage them. If they are active, acknowledge their proof of work.
             5. TONE: Senior blockchain architect meets spiritual guru. Calm, profound, slightly cryptic but helpful.
     
             User Query: "${message}"
             
             Provide a concise but insightful answer (max 4-5 sentences). Cite specific principles.
             `;
        }

        // Call LLM
        const response = await admin.integrations.Core.InvokeLLM({
            prompt: systemPrompt
        });

        // Record Interaction
        if (address && mode !== 'greeting') {
            try {
                await admin.entities.OracleInteraction.create({
                    user_address: address,
                    topic: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
                    type: 'chat'
                });
            } catch (e) {
                 // ignore
            }
        }

        return Response.json({ content: response });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});