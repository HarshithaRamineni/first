import { cookies } from "next/headers";
import { verifyIdToken } from "./firebase-admin";
import { getOrCreateUser } from "./db";

const AUTH_COOKIE_NAME = "firebase-auth-token";

export interface AuthUser {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
}

export async function getSession(): Promise<{ user: AuthUser } | null> {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

        if (!token) {
            return null;
        }

        const decodedToken = await verifyIdToken(token);
        if (!decodedToken) {
            return null;
        }

        // Get or create user in Firestore
        const user = await getOrCreateUser(decodedToken);

        if (!user) {
            return null;
        }

        return {
            user: {
                id: user.id as string,
                email: user.email as string | null,
                name: user.name as string | null,
                image: user.image as string | null,
            },
        };
    } catch (error) {
        console.error("Error getting session:", error);
        return null;
    }
}

export async function auth() {
    return getSession();
}

export { AUTH_COOKIE_NAME };
