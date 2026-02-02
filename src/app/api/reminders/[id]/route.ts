import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { getOrCreateUser, getReminder, updateReminder, deleteReminder } from "@/lib/db";

async function getAuthUser(request: NextRequest) {
    const token = request.cookies.get("firebase-auth-token")?.value;
    if (!token) return null;

    const decoded = await verifyIdToken(token);
    if (!decoded?.email) return null;

    return getOrCreateUser(decoded);
}

// GET /api/reminders/[id] - Get a single reminder
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await getAuthUser(request);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reminder = await getReminder(params.id, user.id as string);

    if (!reminder) {
        return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    return NextResponse.json({ reminder });
}

// PATCH /api/reminders/[id] - Update a reminder
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await getAuthUser(request);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, description, status, priority, dueAt } = body;

        const updates: Record<string, any> = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (status !== undefined) updates.status = status;
        if (priority !== undefined) updates.priority = priority;
        if (dueAt !== undefined) updates.dueAt = new Date(dueAt).toISOString();

        const reminder = await updateReminder(params.id, user.id as string, updates);

        if (!reminder) {
            return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
        }

        return NextResponse.json({ reminder });
    } catch (error) {
        console.error("Error updating reminder:", error);
        return NextResponse.json(
            { error: "Failed to update reminder" },
            { status: 500 }
        );
    }
}

// DELETE /api/reminders/[id] - Delete a reminder
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await getAuthUser(request);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await deleteReminder(params.id, user.id as string);

    if (!deleted) {
        return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
