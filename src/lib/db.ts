import { getDb, verifyIdToken } from "./firebase-admin";

// User operations
export async function getUserByEmail(email: string) {
    const db = getDb();
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
}

export async function createUser(data: { uid: string; email: string; name?: string; image?: string }) {
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
}

export async function getOrCreateUser(decoded: { uid: string; email?: string; name?: string; picture?: string }) {
    if (!decoded.email) return null;

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
}

// Reminder operations
export async function getReminders(userId: string, filters?: { status?: string; type?: string }) {
    const db = getDb();
    let query = db.collection("reminders").where("userId", "==", userId);

    if (filters?.status) {
        query = query.where("status", "==", filters.status);
    }
    if (filters?.type) {
        query = query.where("type", "==", filters.type);
    }

    const snapshot = await query.orderBy("dueAt", "asc").get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
}) {
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await reminderRef.set(reminderData);
    return { id: reminderRef.id, ...reminderData };
}

export async function getReminder(id: string, userId: string) {
    const db = getDb();
    const doc = await db.collection("reminders").doc(id).get();

    if (!doc.exists) return null;

    const data = doc.data();
    if (data?.userId !== userId) return null;

    return { id: doc.id, ...data };
}

export async function updateReminder(id: string, userId: string, updates: Record<string, any>) {
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
}

export async function deleteReminder(id: string, userId: string) {
    const db = getDb();
    const docRef = db.collection("reminders").doc(id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) return false;

    await docRef.delete();
    return true;
}

export async function findReminderBySourceId(userId: string, sourceId: string) {
    const db = getDb();
    const snapshot = await db.collection("reminders")
        .where("userId", "==", userId)
        .where("sourceId", "==", sourceId)
        .where("status", "==", "pending")
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

// Integration operations
export async function getIntegrations(userId: string) {
    const db = getDb();
    const snapshot = await db.collection("integrations")
        .where("userId", "==", userId)
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getIntegration(userId: string, type: string) {
    const db = getDb();
    const snapshot = await db.collection("integrations")
        .where("userId", "==", userId)
        .where("type", "==", type)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function upsertIntegration(userId: string, type: string, data: { enabled?: boolean; config?: any }) {
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
}

export async function updateIntegrationSync(userId: string, type: string) {
    const db = getDb();
    const existing = await getIntegration(userId, type);

    if (existing) {
        const docRef = db.collection("integrations").doc(existing.id);
        await docRef.update({ lastSyncAt: new Date().toISOString() });
    }
}

export async function getEnabledIntegrations(type: string) {
    const db = getDb();
    const snapshot = await db.collection("integrations")
        .where("type", "==", type)
        .where("enabled", "==", true)
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
