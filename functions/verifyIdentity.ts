import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Parse body
        const { identityId } = await req.json();

        if (!identityId) {
            return Response.json({ error: "Missing identityId" }, { status: 400 });
        }
        
        // Fetch identity
        const identity = await base44.entities.Identity.get(identityId);
        
        if (!identity) {
            return Response.json({ error: "Identity not found" }, { status: 404 });
        }

        if (!identity.id_document_url) {
            return Response.json({ error: "No ID document uploaded" }, { status: 400 });
        }

        // Set status to pending immediately
        await base44.entities.Identity.update(identityId, { verification_status: 'pending' });

        // AI Analysis
        const aiResponse = await base44.integrations.Core.InvokeLLM({
            prompt: "Analyze this image carefully. Does it appear to be a valid government-issued ID document (like a passport, driver's license, or national ID card)? Check for clarity, text legibility, and standard ID features. Return a JSON object with 'isValid' (boolean) and 'reason' (string explaining why it is valid or invalid). Be strict.",
            file_urls: [identity.id_document_url],
            response_json_schema: {
                type: "object",
                properties: {
                    isValid: { type: "boolean" },
                    reason: { type: "string" }
                },
                required: ["isValid", "reason"]
            }
        });

        const result = aiResponse;

        // Determine status
        const newStatus = result.isValid ? 'verified' : 'rejected';
        
        // Update Identity with results
        await base44.entities.Identity.update(identityId, {
            verification_status: newStatus,
            verification_feedback: result.reason
        });

        return Response.json({ 
            status: newStatus, 
            reason: result.reason 
        });

    } catch (error) {
        console.error("Verification error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});