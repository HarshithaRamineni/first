import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let initialized = false;

function getFirebaseAdmin() {
    if (initialized && app && auth && db) {
        return { app, auth, db };
    }

    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (!serviceAccountKey) {
            console.error("FIREBASE_SERVICE_ACCOUNT_KEY not configured");
            throw new Error("Firebase Admin not configured");
        }

        let serviceAccount;
        try {
            serviceAccount = JSON.parse(serviceAccountKey);
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
            throw new Error("Invalid Firebase service account key format");
        }

        if (getApps().length === 0) {
            app = initializeApp({
                credential: cert(serviceAccount),
            });
        } else {
            app = getApps()[0];
        }

        auth = getAuth(app);
        db = getFirestore(app);
        initialized = true;

        return { app, auth, db };
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
        throw error;
    }
}

export async function verifyIdToken(token: string) {
    try {
        const { auth } = getFirebaseAdmin();
        const decodedToken = await auth.verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error("Error verifying token:", error);
        return null;
    }
}

export async function getUser(uid: string) {
    try {
        const { auth } = getFirebaseAdmin();
        const user = await auth.getUser(uid);
        return user;
    } catch (error) {
        console.error("Error getting user:", error);
        return null;
    }
}

export function getDb() {
    try {
        const { db } = getFirebaseAdmin();
        return db;
    } catch (error) {
        console.error("Error getting Firestore:", error);
        throw error;
    }
}

export { getFirebaseAdmin };
