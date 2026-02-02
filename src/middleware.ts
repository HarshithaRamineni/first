import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isAuthPage = pathname.startsWith("/login");
    const isDashboard = pathname.startsWith("/dashboard");
    const isApiRoute = pathname.startsWith("/api");
    const isCronRoute = pathname.startsWith("/api/cron");

    // Allow cron routes to pass through (they have their own auth)
    if (isCronRoute) {
        return NextResponse.next();
    }

    // Allow API routes to handle their own auth
    if (isApiRoute) {
        return NextResponse.next();
    }

    // Check for auth cookie
    const token = request.cookies.get("firebase-auth-token")?.value;
    const isLoggedIn = !!token;

    // Redirect logged-in users away from auth pages
    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Protect dashboard routes
    if (isDashboard && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)"],
};
