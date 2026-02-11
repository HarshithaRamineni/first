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

/**
 * Verify authentication from Next.js request (for API routes)
 * Returns userId if authenticated, null otherwise
 */
export async function verifyAuth(request: Request): Promise<string | null> {
    try {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
            return null;
        }

        // Parse cookie header to get auth token
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split("=");
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>);

        const token = cookies[AUTH_COOKIE_NAME];
        if (!token) {
            return null;
        }

        const decodedToken = await verifyIdToken(token);
        if (!decodedToken) {
            return null;
        }

        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying auth:", error);
        return null;
    }
}

export { AUTH_COOKIE_NAME };
