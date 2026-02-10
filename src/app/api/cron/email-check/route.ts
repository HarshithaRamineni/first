import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/utils";
import { getEnabledIntegrations, updateIntegrationSync } from "@/lib/db";
import { createEmailFollowUpReminders } from "@/lib/gmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    // Verify cron secret for security
    if (!verifyCronSecret(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("[CRON] Starting email check job...");

        // Get all users with Gmail integration enabled
        const integrations = await getEnabledIntegrations("gmail");

        console.log(`[CRON] Found ${integrations.length} users with Gmail integration`);

        let totalReminders = 0;

        for (const integration of integrations) {
            try {
                const userId = integration.userId as string;
                console.log(`[CRON] Processing user ${userId}`);

                // Actually fetch Gmail threads and create follow-up reminders
                const result = await createEmailFollowUpReminders(userId);
                totalReminders += result.created;

                if (result.error) {
                    console.warn(`[CRON] Warning for user ${userId}: ${result.error}`);
                }
            } catch (error) {
                console.error(`[CRON] Error processing integration:`, error);
            }
        }

        console.log(`[CRON] Email check complete. Created ${totalReminders} total reminders.`);

        return NextResponse.json({
            success: true,
            usersProcessed: integrations.length,
            remindersCreated: totalReminders,
        });
    } catch (error) {
        console.error("[CRON] Email check job failed:", error);
        return NextResponse.json(
            { error: "Cron job failed" },
            { status: 500 }
        );
    }
}
