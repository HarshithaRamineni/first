"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Mail, Github, Zap, ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
    const { user, loading, signInWithGoogle, signInWithGithub } = useAuth();
    const router = useRouter();
    const [signingIn, setSigningIn] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        if (user && !loading) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    const handleGoogleSignIn = async () => {
        try {
            setSigningIn(true);
            setAuthError(null);
            await signInWithGoogle();
        } catch (error: any) {
            console.error("Error signing in with Google:", error);
            if (error.code === "auth/popup-blocked") {
                setAuthError("Popup was blocked. Please allow popups for this site and try again.");
            } else if (error.code === "auth/cancelled-popup-request") {
                setAuthError(null); // User cancelled, not an error
            } else {
                setAuthError(error.message || "Failed to sign in. Please try again.");
            }
        } finally {
            setSigningIn(false);
        }
    };

    const handleGithubSignIn = async () => {
        try {
            setSigningIn(true);
            setAuthError(null);
            await signInWithGithub();
        } catch (error: any) {
            console.error("Error signing in with GitHub:", error);
            if (error.code === "auth/popup-blocked") {
                setAuthError("Popup was blocked. Please allow popups for this site and try again.");
            } else {
                setAuthError(error.message || "Failed to sign in. Please try again.");
            }
        } finally {
            setSigningIn(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex">
            {/* Left Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
                        <ArrowLeft className="w-4 h-4" />
                        Back to home
                    </Link>

                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold gradient-text">AiXOps</span>
                    </div>

                    <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
                    <p className="text-gray-400 mb-8">
                        Sign in to your account to continue automating your workflow.
                    </p>

                    {authError && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {authError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={signingIn}
                            className="w-full btn bg-white text-black hover:bg-gray-100 py-4 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {signingIn ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Mail className="w-5 h-5 text-red-500" />
                            )}
                            {signingIn ? "Signing in..." : "Continue with Google"}
                        </button>

                        <button
                            onClick={handleGithubSignIn}
                            disabled={signingIn}
                            className="w-full btn btn-secondary py-4 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {signingIn ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Github className="w-5 h-5" />
                            )}
                            {signingIn ? "Signing in..." : "Continue with GitHub"}
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-8 text-center">
                        By signing in, you agree to our{" "}
                        <Link href="#" className="text-primary hover:underline">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>.
                    </p>
                </div>
            </div>

            {/* Right Panel - Visual */}
            <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-12 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/30 rounded-full blur-[100px]" />

                <div className="relative z-10 text-center max-w-lg">
                    <div className="card glass p-8 mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold">Email Follow-up Reminder</div>
                                <div className="text-sm text-gray-400">John from Acme Corp - 3 days ago</div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 text-left">
                            "Re: Partnership Proposal" - You haven't responded to this email thread. Would you like to follow up?
                        </p>
                    </div>

                    <div className="card glass p-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                                <Github className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold">PR Review Pending</div>
                                <div className="text-sm text-gray-400">feat: Add user authentication</div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 text-left">
                            This PR has been open for 5 days without review. 2 team members are assigned.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

