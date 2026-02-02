import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/utils";
import { getEnabledIntegrations, updateIntegrationSync } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    // Verify cron secret for security
    if (!verifyCronSecret(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("[CRON] Starting GitHub check job...");

        // Get all users with GitHub integration enabled
        const integrations = await getEnabledIntegrations("github");

        console.log(`[CRON] Found ${integrations.length} users with GitHub integration`);

        let totalReminders = 0;

        for (const integration of integrations) {
            try {
                const userId = integration.userId as string;
                // TODO: Implement GitHub API integration to fetch PRs and issues
                console.log(`[CRON] Processing user ${userId}`);
                await updateIntegrationSync(userId, "github");
            } catch (error) {
                console.error(`[CRON] Error processing integration:`, error);
            }
        }

        console.log(`[CRON] GitHub check complete. Created ${totalReminders} total reminders.`);

        return NextResponse.json({
            success: true,
            usersProcessed: integrations.length,
            remindersCreated: totalReminders,
        });
    } catch (error) {
        console.error("[CRON] GitHub check job failed:", error);
        return NextResponse.json(
            { error: "Cron job failed" },
            { status: 500 }
        );
    }
}
