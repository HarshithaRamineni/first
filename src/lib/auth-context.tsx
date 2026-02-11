"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    signOut as firebaseSignOut,
    getIdToken
} from "firebase/auth";
import { auth, googleProvider, githubProvider } from "./firebase";
import { setCookie, deleteCookie } from "cookies-next";
import { GoogleAuthProvider as GoogleAuthProviderClass } from "firebase/auth";

const AUTH_COOKIE_NAME = "firebase-auth-token";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithGithub: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("[Auth] Auth state changed:", currentUser ? currentUser.email : "signed out");
            setUser(currentUser);
            setLoading(false);

            if (currentUser) {
                try {
                    const token = await getIdToken(currentUser);
                    setCookie(AUTH_COOKIE_NAME, token, {
                        maxAge: 60 * 60 * 24 * 7, // 7 days
                        path: "/",
                        sameSite: "lax",
                        secure: process.env.NODE_ENV === "production",
                    });
                    console.log("[Auth] Cookie set successfully");
                } catch (error) {
                    console.error("[Auth] Error setting cookie:", error);
                }
            } else {
                deleteCookie(AUTH_COOKIE_NAME);
            }
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            console.log("[Auth] Starting Google sign-in with popup...");
            const result = await signInWithPopup(auth, googleProvider);
            console.log("[Auth] Google sign-in successful:", result.user.email);

            // Extract Google OAuth credential for Gmail API access
            const credential = GoogleAuthProviderClass.credentialFromResult(result);
            if (credential?.accessToken) {
                console.log("[Auth] Got access token, storing for Gmail sync...");

                // Wait a moment so the cookie is set by onAuthStateChanged
                await new Promise(resolve => setTimeout(resolve, 500));

                const tokenData: any = {
                    accessToken: credential.accessToken,
                    provider: "google",
                    expiresIn: 3600,
                };

                // Try to get refresh token
                const oauthCred = credential as any;
                if (oauthCred.refreshToken) {
                    tokenData.refreshToken = oauthCred.refreshToken;
                }

                try {
                    const response = await fetch("/api/auth/store-token", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(tokenData),
                    });

                    if (response.ok) {
                        console.log("[Auth] OAuth token stored successfully");
                    } else {
                        const errorText = await response.text();
                        console.error("[Auth] Failed to store token:", response.status, errorText);
                    }
                } catch (err) {
                    console.error("[Auth] Error storing OAuth token:", err);
                }
            }
        } catch (error: any) {
            // Handle specific popup errors
            if (error.code === "auth/popup-closed-by-user") {
                console.log("[Auth] User closed the popup");
                return; // Don't throw, user just cancelled
            }
            if (error.code === "auth/popup-blocked") {
                console.error("[Auth] Popup was blocked by browser. Please allow popups for this site.");
            }
            console.error("[Auth] Error signing in with Google:", error.code, error.message);
            throw error;
        }
    };

    const signInWithGithub = async () => {
        try {
            console.log("[Auth] Starting GitHub sign-in with popup...");
            const result = await signInWithPopup(auth, githubProvider);
            console.log("[Auth] GitHub sign-in successful:", result.user.email);
        } catch (error: any) {
            if (error.code === "auth/popup-closed-by-user") {
                console.log("[Auth] User closed the popup");
                return;
            }
            if (error.code === "auth/popup-blocked") {
                console.error("[Auth] Popup was blocked by browser. Please allow popups for this site.");
            }
            console.error("[Auth] Error signing in with GitHub:", error.code, error.message);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            deleteCookie(AUTH_COOKIE_NAME);
        } catch (error) {
            console.error("Error signing out:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithGithub, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
