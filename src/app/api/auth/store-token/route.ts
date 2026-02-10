import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { getDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
    try {
        // Verify the user is authenticated
        const token = request.cookies.get("firebase-auth-token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = await verifyIdToken(token);
        if (!decoded?.uid) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { accessToken, provider } = body;

        if (!accessToken || !provider) {
            return NextResponse.json(
                { error: "Missing accessToken or provider" },
                { status: 400 }
            );
        }

        // Store the OAuth token in Firestore
        const db = getDb();
        const accountRef = db.collection("accounts").doc(`${decoded.uid}_${provider}`);

        await accountRef.set(
            {
                userId: decoded.uid,
                provider,
                accessToken,
                storedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );

        console.log(`[Auth] Stored ${provider} OAuth token for user ${decoded.uid}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error storing OAuth token:", error);
        return NextResponse.json(
            { error: "Failed to store token" },
            { status: 500 }
        );
    }
}
