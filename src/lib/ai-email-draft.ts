/**
 * AI Email Draft Service using Cerebras API
 * Generates personalized follow-up emails based on context
 */

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions";

interface EmailContext {
    originalSubject: string;
    originalSnippet: string;
    recipientName?: string;
    daysSinceLastEmail: number;
    previousAttempts?: number;
}

interface DraftEmailResponse {
    subject: string;
    body: string;
    tone: "friendly" | "professional" | "urgent";
}

/**
 * Generate a follow-up email draft using AI
 */
export async function generateFollowUpDraft(
    context: EmailContext
): Promise<DraftEmailResponse> {
    if (!CEREBRAS_API_KEY) {
        throw new Error("CEREBRAS_API_KEY not configured");
    }

    const prompt = buildFollowUpPrompt(context);

    try {
        const response = await fetch(CEREBRAS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${CEREBRAS_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama3.1-8b",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert email assistant that writes professional, concise, and effective follow-up emails. Your follow-ups are polite but persistent, and you always provide value in your messages.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("[AI Draft] Cerebras API error:", error);
            throw new Error("Failed to generate AI draft");
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content || "";

        return parseAIDraftResponse(aiResponse, context);
    } catch (error) {
        console.error("[AI Draft] Error generating draft:", error);
        // Fallback to template-based draft
        return generateTemplateDraft(context);
    }
}

/**
 * Build prompt for AI to generate follow-up email
 */
function buildFollowUpPrompt(context: EmailContext): string {
    const {
        originalSubject,
        originalSnippet,
        recipientName,
        daysSinceLastEmail,
        previousAttempts = 0,
    } = context;

    let urgencyLevel = "polite";
    if (daysSinceLastEmail > 14) urgencyLevel = "persistent";
    if (daysSinceLastEmail > 21) urgencyLevel = "urgent";

    return `
Write a ${urgencyLevel} follow-up email for the following context:

ORIGINAL EMAIL SUBJECT: "${originalSubject}"
ORIGINAL EMAIL SNIPPET: "${originalSnippet}"
${recipientName ? `RECIPIENT: ${recipientName}` : ""}
DAYS SINCE LAST EMAIL: ${daysSinceLastEmail} days
PREVIOUS FOLLOW-UP ATTEMPTS: ${previousAttempts}

Requirements:
1. Keep it concise (2-3 short paragraphs max)
2. Reference the previous email naturally
3. Add value or provide a gentle nudge
4. Include a clear call-to-action
5. Maintain a ${urgencyLevel} but professional tone
6. End with a professional signature line

Format your response as:
SUBJECT: [new subject line]
BODY:
[email body text]

Do not include greetings or signatures, just the core content.
    `.trim();
}

/**
 * Parse AI response into structured format
 */
function parseAIDraftResponse(
    aiResponse: string,
    context: EmailContext
): DraftEmailResponse {
    const lines = aiResponse.split("\n");
    let subject = "";
    let body = "";
    let inBody = false;

    for (const line of lines) {
        if (line.startsWith("SUBJECT:")) {
            subject = line.replace("SUBJECT:", "").trim();
        } else if (line.startsWith("BODY:")) {
            inBody = true;
        } else if (inBody && line.trim()) {
            body += line + "\n";
        }
    }

    // Fallback if parsing failed
    if (!subject || !body) {
        subject = `Re: ${context.originalSubject}`;
        body = aiResponse;
    }

    // Determine tone based on content
    const tone = determineTone(context.daysSinceLastEmail);

    return {
        subject: subject.replace(/^Re:\s*/i, "Re: "),
        body: body.trim(),
        tone,
    };
}

/**
 * Determine email tone based on days passed
 */
function determineTone(daysSinceLastEmail: number): "friendly" | "professional" | "urgent" {
    if (daysSinceLastEmail < 7) return "friendly";
    if (daysSinceLastEmail < 14) return "professional";
    return "urgent";
}

/**
 * Fallback template-based draft when AI fails
 */
function generateTemplateDraft(context: EmailContext): DraftEmailResponse {
    const { originalSubject, daysSinceLastEmail, previousAttempts = 0 } = context;

    let body = "";
    const tone = determineTone(daysSinceLastEmail);

    if (previousAttempts === 0) {
        // First follow-up
        body = `I wanted to follow up on my previous email regarding "${originalSubject}".

I understand you're likely busy, but I wanted to check if you had a chance to review my message. If you need any additional information or clarification, I'm happy to provide it.

Looking forward to hearing from you.`;
    } else if (previousAttempts === 1) {
        // Second follow-up
        body = `I'm following up once more regarding "${originalSubject}".

I haven't heard back yet and wanted to make sure my previous messages didn't get lost. If now isn't a good time, please let me know when would work better for you.

I appreciate your time and look forward to your response.`;
    } else {
        // Final follow-up
        body = `This is my final follow-up regarding "${originalSubject}".

I've reached out a few times but haven't received a response. If you're no longer interested or if this isn't the right time, I completely understand.

If I don't hear back, I'll assume you'd prefer not to continue this conversation. Thank you for your consideration.`;
    }

    return {
        subject: `Re: ${originalSubject}`,
        body,
        tone,
    };
}

/**
 * Preview a follow-up draft (for UI display)
 */
export async function previewFollowUpDraft(context: EmailContext): Promise<DraftEmailResponse> {
    return generateFollowUpDraft(context);
}
