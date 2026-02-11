import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { generateFollowUpDraft } from "@/lib/ai-email-draft";

/**
 * POST /api/email/draft
 * Generate an AI-powered follow-up email draft
 */
export async function POST(request: NextRequest) {
    try {
        const userId = await verifyAuth(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            originalSubject,
            originalSnippet,
            recipientName,
            daysSinceLastEmail,
            previousAttempts,
        } = body;

        if (!originalSubject || !originalSnippet) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const draft = await generateFollowUpDraft({
            originalSubject,
            originalSnippet,
            recipientName,
            daysSinceLastEmail: daysSinceLastEmail || 3,
            previousAttempts: previousAttempts || 0,
        });

        return NextResponse.json({
            draft,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Email Draft API] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate draft" },
            { status: 500 }
        );
    }
}
