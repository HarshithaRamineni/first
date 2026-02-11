import { getDb, verifyIdToken } from "./firebase-admin";

// User operations
export async function getUserByEmail(email: string) {
    try {
        const db = getDb();
        const usersRef = db.collection("users");
        const snapshot = await usersRef.where("email", "==", email).limit(1).get();

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        console.error("Error getting user by email:", error);
        return null;
    }
}

export async function createUser(data: { uid: string; email: string; name?: string; image?: string }) {
    try {
        const db = getDb();
        const userRef = db.collection("users").doc(data.uid);

        const userData = {
            email: data.email,
            name: data.name || null,
            image: data.image || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await userRef.set(userData);
        return { id: data.uid, ...userData };
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}

export async function getOrCreateUser(decoded: { uid: string; email?: string; name?: string; picture?: string }) {
    if (!decoded.email) return null;

    try {
        let user = await getUserByEmail(decoded.email);

        if (!user) {
            user = await createUser({
                uid: decoded.uid,
                email: decoded.email,
                name: decoded.name,
                image: decoded.picture,
            });
        }

        return user;
    } catch (error) {
        console.error("Error in getOrCreateUser:", error);
        return null;
    }
}

// Reminder operations
export async function getReminders(userId: string, filters?: { status?: string; type?: string }) {
    try {
        const db = getDb();
        // Simple query without composite index requirement
        let query = db.collection("reminders").where("userId", "==", userId);

        const snapshot = await query.get();

        let reminders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter in memory to avoid composite index issues
        if (filters?.status) {
            reminders = reminders.filter((r: any) => r.status === filters.status);
        }
        if (filters?.type) {
            reminders = reminders.filter((r: any) => r.type === filters.type);
        }

        // Sort by dueAt
        reminders.sort((a: any, b: any) => {
            const dateA = new Date(a.dueAt).getTime();
            const dateB = new Date(b.dueAt).getTime();
            return dateA - dateB;
        });

        return reminders;
    } catch (error) {
        console.error("Error getting reminders:", error);
        return [];
    }
}

export async function createReminder(data: {
    userId: string;
    type: string;
    title: string;
    description?: string;
    dueAt: string;
    priority?: string;
    sourceId?: string;
    sourceUrl?: string;
    followUpDays?: number;
    autoFollowUp?: boolean;
}) {
    try {
        const db = getDb();
        const reminderRef = db.collection("reminders").doc();

        const reminderData = {
            userId: data.userId,
            type: data.type || "custom",
            title: data.title,
            description: data.description || null,
            dueAt: data.dueAt,
            priority: data.priority || "medium",
            status: "pending",
            sourceId: data.sourceId || null,
            sourceUrl: data.sourceUrl || null,
            followUpDays: data.followUpDays || null,
            autoFollowUp: data.autoFollowUp || false,
            nextFollowUpAt: data.followUpDays
                ? new Date(Date.now() + data.followUpDays * 24 * 60 * 60 * 1000).toISOString()
                : null,
            followUpAttempts: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await reminderRef.set(reminderData);
        return { id: reminderRef.id, ...reminderData };
    } catch (error) {
        console.error("Error creating reminder:", error);
        throw error;
    }
}

export async function getReminder(id: string, userId: string) {
    try {
        const db = getDb();
        const doc = await db.collection("reminders").doc(id).get();

        if (!doc.exists) return null;

        const data = doc.data();
        if (data?.userId !== userId) return null;

        return { id: doc.id, ...data };
    } catch (error) {
        console.error("Error getting reminder:", error);
        return null;
    }
}

export async function updateReminder(id: string, userId: string, updates: Record<string, any>) {
    try {
        const db = getDb();
        const docRef = db.collection("reminders").doc(id);
        const doc = await docRef.get();

        if (!doc.exists || doc.data()?.userId !== userId) return null;

        const updateData = {
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        await docRef.update(updateData);
        return { id: doc.id, ...doc.data(), ...updateData };
    } catch (error) {
        console.error("Error updating reminder:", error);
        return null;
    }
}

export async function deleteReminder(id: string, userId: string) {
    try {
        const db = getDb();
        const docRef = db.collection("reminders").doc(id);
        const doc = await docRef.get();

        if (!doc.exists || doc.data()?.userId !== userId) return false;

        await docRef.delete();
        return true;
    } catch (error) {
        console.error("Error deleting reminder:", error);
        return false;
    }
}

export async function findReminderBySourceId(userId: string, sourceId: string) {
    try {
        const db = getDb();
        const snapshot = await db.collection("reminders")
            .where("userId", "==", userId)
            .where("sourceId", "==", sourceId)
            .limit(1)
            .get();

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        const data = doc.data();
        if (data?.status !== "pending") return null;

        return { id: doc.id, ...data };
    } catch (error) {
        console.error("Error finding reminder by source:", error);
        return null;
    }
}

// Integration operations
export async function getIntegrations(userId: string) {
    try {
        const db = getDb();
        const snapshot = await db.collection("integrations")
            .where("userId", "==", userId)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting integrations:", error);
        return [];
    }
}

export async function getIntegration(userId: string, type: string) {
    try {
        const db = getDb();
        const snapshot = await db.collection("integrations")
            .where("userId", "==", userId)
            .where("type", "==", type)
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
        console.error("Error getting integration:", error);
        return null;
    }
}

export async function upsertIntegration(userId: string, type: string, data: { enabled?: boolean; config?: any }) {
    try {
        const db = getDb();
        const existing = await getIntegration(userId, type);

        if (existing) {
            const docRef = db.collection("integrations").doc(existing.id);
            const updateData = {
                enabled: data.enabled ?? true,
                config: data.config || {},
                updatedAt: new Date().toISOString(),
            };
            await docRef.update(updateData);
            return { ...existing, ...updateData };
        } else {
            const docRef = db.collection("integrations").doc();
            const newData = {
                userId,
                type,
                enabled: data.enabled ?? true,
                config: data.config || {},
                lastSyncAt: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await docRef.set(newData);
            return { id: docRef.id, ...newData };
        }
    } catch (error) {
        console.error("Error upserting integration:", error);
        throw error;
    }
}

export async function updateIntegrationSync(userId: string, type: string) {
    try {
        const db = getDb();
        const existing = await getIntegration(userId, type);

        if (existing) {
            const docRef = db.collection("integrations").doc(existing.id);
            await docRef.update({ lastSyncAt: new Date().toISOString() });
        }
    } catch (error) {
        console.error("Error updating integration sync:", error);
    }
}

export async function getEnabledIntegrations(type: string) {
    try {
        const db = getDb();
        const snapshot = await db.collection("integrations")
            .where("type", "==", type)
            .where("enabled", "==", true)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting enabled integrations:", error);
        return [];
    }
}

// Follow-up operations
export async function getRemindersDueForFollowUp() {
    try {
        const db = getDb();
        const now = new Date().toISOString();

        const snapshot = await db.collection("reminders")
            .where("autoFollowUp", "==", true)
            .where("status", "==", "pending")
            .get();

        // Filter in memory for nextFollowUpAt check
        const dueReminders = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((r: any) => r.nextFollowUpAt && r.nextFollowUpAt <= now);

        return dueReminders;
    } catch (error) {
        console.error("Error getting reminders due for follow-up:", error);
        return [];
    }
}

export async function updateFollowUpAttempt(reminderId: string) {
    try {
        const db = getDb();
        const docRef = db.collection("reminders").doc(reminderId);
        const doc = await docRef.get();

        if (!doc.exists) return null;

        const data = doc.data();
        const followUpAttempts = (data?.followUpAttempts || 0) + 1;
        const followUpDays = data?.followUpDays || 3;

        // Calculate next follow-up date (double the interval each time, max 14 days)
        const nextInterval = Math.min(followUpDays * Math.pow(2, followUpAttempts - 1), 14);
        const nextFollowUpAt = new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000).toISOString();

        await docRef.update({
            followUpAttempts,
            nextFollowUpAt,
            updatedAt: new Date().toISOString(),
        });

        return { id: reminderId, followUpAttempts, nextFollowUpAt };
    } catch (error) {
        console.error("Error updating follow-up attempt:", error);
        return null;
    }
}
