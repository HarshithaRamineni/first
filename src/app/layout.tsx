import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "AiXOps - AI-Powered Developer Operations",
    description: "Automate email follow-ups, GitHub reminders, and activity tracking with AI. Built for developers and teams who want to focus on what matters.",
    keywords: ["automation", "devops", "github", "gmail", "ai", "productivity"],
    authors: [{ name: "AiXOps" }],
    openGraph: {
        title: "AiXOps - AI-Powered Developer Operations",
        description: "Automate email follow-ups, GitHub reminders, and activity tracking with AI.",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
