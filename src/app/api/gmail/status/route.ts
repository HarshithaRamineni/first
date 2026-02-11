import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getDb } from "@/lib/firebase-admin";
import { getOrCreateUser } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        // Verify the user is authenticated
        const token = request.cookies.get("firebase-auth-token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized", status: "not_authenticated" }, { status: 401 });
        }

        const decoded = await verifyIdToken(token);
        if (!decoded?.email) {
            return NextResponse.json({ error: "Invalid token", status: "invalid_token" }, { status: 401 });
        }

        const user = await getOrCreateUser(decoded);
        if (!user) {
            return NextResponse.json({ error: "User not found", status: "no_user" }, { status: 404 });
        }

        // Check if Google OAuth token exists in Firestore
        const db = getDb();
        const accountDoc = await db.collection("accounts").doc(`${user.id}_google`).get();

        if (!accountDoc.exists) {
            return NextResponse.json({
                status: "no_token",
                message: "No Google OAuth token found. Please sign out and sign in again with Google.",
                userId: user.id,
                documentPath: `accounts/${user.id}_google`,
            });
        }

        const data = accountDoc.data();
        const now = new Date();
        const expiresAt = data?.expiresAt ? new Date(data.expiresAt) : null;
        const isExpired = expiresAt ? expiresAt <= now : true;

        return NextResponse.json({
            status: isExpired ? "token_expired" : "connected",
            hasAccessToken: !!data?.accessToken,
            hasRefreshToken: !!data?.refreshToken,
            expiresAt: data?.expiresAt || null,
            isExpired,
            storedAt: data?.storedAt || null,
            provider: data?.provider || null,
            userId: user.id,
            message: isExpired
                ? "Token is expired. " + (data?.refreshToken ? "Refresh token available - sync should auto-refresh." : "No refresh token - please sign out and sign in again.")
                : "Token is valid and ready for Gmail sync.",
        });
    } catch (error) {
        console.error("[Gmail Status] Error:", error);
        return NextResponse.json(
            { error: "Failed to check status", status: "error" },
            { status: 500 }
        );
    }
}
