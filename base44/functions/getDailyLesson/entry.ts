import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const admin = base44.asServiceRole;

        // Get today's date string YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];

        // 1. Check if lesson already exists for today
        const existingLessons = await admin.entities.Lesson.filter({ date: today });
        
        // Fetch history (last 5 lessons)
        const history = await admin.entities.Lesson.filter({}, '-date', 6);
        // Filter out today from history if it exists there to avoid duplication in list
        const pastLessons = history.filter(l => l.date !== today);

        if (existingLessons.length > 0) {
            return Response.json({
                today: existingLessons[0],
                history: pastLessons
            });
        }

        // 2. Generate new lesson if none exists
        // Get principles to base the lesson on
        const principles = await admin.entities.Principle.list();
        
        if (principles.length === 0) {
             return Response.json({ error: "No principles found to generate lesson" }, { status: 500 });
        }

        // Pick a random principle (or cycle based on day of year, but random is fine for now)
        const randomPrinciple = principles[Math.floor(Math.random() * principles.length)];

        // Generate content via LLM
        const prompt = `
        You are the Etherene Oracle, a digital sage.
        Generate a "Daily Lesson" for the user based on the following Manifesto Principle:
        "${randomPrinciple.title}: ${randomPrinciple.description}"

        The lesson should be:
        1. Deeply philosophical but grounded in blockchain metaphors (mining, nodes, consensus, keys, etc.).
        2. About 150-200 words long.
        3. Include a practical "Micro-Action" or exercise the user can do today.

        Return ONLY a JSON object with this schema:
        {
            "title": "A short, catchy title for the lesson",
            "content": "The main lesson text...",
            "practical_exercise": "The specific action for the user..."
        }
        `;

        const llmResponse = await admin.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    content: { type: "string" },
                    practical_exercise: { type: "string" }
                },
                required: ["title", "content", "practical_exercise"]
            }
        });

        // 3. Save the new lesson
        const newLessonData = {
            title: llmResponse.title,
            content: llmResponse.content,
            practical_exercise: llmResponse.practical_exercise,
            principle_title: randomPrinciple.title,
            date: today
        };

        const newLesson = await admin.entities.Lesson.create(newLessonData);

        return Response.json({
            today: newLesson,
            history: pastLessons
        });

    } catch (error) {
        console.error("Error generating lesson:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});