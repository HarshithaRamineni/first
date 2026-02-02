import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { getOrCreateUser, getReminders, createReminder } from "@/lib/db";

async function getAuthUser(request: NextRequest) {
    const token = request.cookies.get("firebase-auth-token")?.value;
    if (!token) return null;

    const decoded = await verifyIdToken(token);
    if (!decoded?.email) return null;

    return getOrCreateUser(decoded);
}

// GET /api/reminders - List all reminders for current user
export async function GET(request: NextRequest) {
    const user = await getAuthUser(request);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;

    const reminders = await getReminders(user.id as string, { status, type });

    return NextResponse.json({ reminders });
}

// POST /api/reminders - Create a new reminder
export async function POST(request: NextRequest) {
    const user = await getAuthUser(request);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, description, type, dueAt, priority, sourceId, sourceUrl } = body;

        if (!title || !dueAt) {
            return NextResponse.json(
                { error: "Title and dueAt are required" },
                { status: 400 }
            );
        }

        const reminder = await createReminder({
            userId: user.id as string,
            title,
            description,
            type: type || "custom",
            dueAt: new Date(dueAt).toISOString(),
            priority: priority || "medium",
            sourceId,
            sourceUrl,
        });

        return NextResponse.json({ reminder }, { status: 201 });
    } catch (error) {
        console.error("Error creating reminder:", error);
        return NextResponse.json(
            { error: "Failed to create reminder" },
            { status: 500 }
        );
    }
}
