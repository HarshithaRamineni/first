import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { getOrCreateUser, getIntegrations, upsertIntegration } from "@/lib/db";

async function getAuthUser(request: NextRequest) {
    try {
        const token = request.cookies.get("firebase-auth-token")?.value;
        if (!token) return null;

        const decoded = await verifyIdToken(token);
        if (!decoded?.email) return null;

        return await getOrCreateUser(decoded);
    } catch (error) {
        console.error("Error getting auth user:", error);
        return null;
    }
}

// GET /api/integrations - List all integrations for current user
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);

        if (!user) {
            return NextResponse.json({ integrations: [] });
        }

        const integrations = await getIntegrations(user.id as string);

        return NextResponse.json({ integrations });
    } catch (error) {
        console.error("Error fetching integrations:", error);
        return NextResponse.json({ integrations: [], error: "Failed to fetch integrations" }, { status: 200 });
    }
}

// POST /api/integrations - Enable/configure an integration
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { type, enabled, config } = body;

        if (!type || !["gmail", "github"].includes(type)) {
            return NextResponse.json(
                { error: "Invalid integration type" },
                { status: 400 }
            );
        }

        const integration = await upsertIntegration(user.id as string, type, {
            enabled: enabled ?? true,
            config: config || {},
        });

        return NextResponse.json({ integration });
    } catch (error) {
        console.error("Error configuring integration:", error);
        return NextResponse.json(
            { error: "Failed to configure integration" },
            { status: 500 }
        );
    }
}
