import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { getOrCreateUser } from "@/lib/db";
import { createEmailFollowUpReminders } from "@/lib/gmail";

export async function POST(request: NextRequest) {
    try {
        // Verify the user is authenticated
        const token = request.cookies.get("firebase-auth-token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = await verifyIdToken(token);
        if (!decoded?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await getOrCreateUser(decoded);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log(`[Gmail Sync API] Starting sync for user ${user.id}`);

        const result = await createEmailFollowUpReminders(user.id as string);

        return NextResponse.json({
            success: !result.error,
            remindersCreated: result.created,
            error: result.error || null,
        });
    } catch (error) {
        console.error("[Gmail Sync API] Error:", error);
        return NextResponse.json(
            { error: "Failed to sync Gmail" },
            { status: 500 }
        );
    }
}
