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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);

            if (user) {
                // Get ID token and store in cookie for server-side auth
                const token = await getIdToken(user);
                setCookie(AUTH_COOKIE_NAME, token, {
                    maxAge: 60 * 60 * 24 * 7, // 7 days
                    path: "/",
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                });
            } else {
                deleteCookie(AUTH_COOKIE_NAME);
            }
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);

            // Extract Google OAuth access token for Gmail API access
            const credential = GoogleAuthProviderClass.credentialFromResult(result);
            if (credential?.accessToken) {
                // Store OAuth token server-side for Gmail sync
                try {
                    await fetch("/api/auth/store-token", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            accessToken: credential.accessToken,
                            provider: "google",
                        }),
                    });
                } catch (err) {
                    console.warn("Failed to store OAuth token:", err);
                }
            }
        } catch (error) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    };

    const signInWithGithub = async () => {
        try {
            await signInWithPopup(auth, githubProvider);
        } catch (error) {
            console.error("Error signing in with GitHub:", error);
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
