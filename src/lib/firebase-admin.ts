import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function getFirebaseAdmin() {
    if (!app) {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (!serviceAccountKey) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not configured");
        }

        let serviceAccount;
        try {
            serviceAccount = JSON.parse(serviceAccountKey);
        } catch (e) {
            throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON format");
        }

        if (getApps().length === 0) {
            app = initializeApp({
                credential: cert(serviceAccount),
            });
        } else {
            app = getApps()[0];
        }
    }

    if (!auth) {
        auth = getAuth(app);
    }

    if (!db) {
        db = getFirestore(app);
    }

    return { app, auth, db };
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
    const { db } = getFirebaseAdmin();
    return db;
}

export { getFirebaseAdmin };
