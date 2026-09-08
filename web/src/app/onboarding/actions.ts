"use server";

import { getSessionWithRole } from "@/lib/auth/session";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateOnboarding(data: {
    step?: number;
    completed?: boolean;
    industry?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
}) {
    const session = await getSessionWithRole();
    if (!session) return { success: false, error: "Unauthorized" };

    const updates: Partial<typeof users.$inferInsert> = {
        updatedAt: new Date(),
    };

    if (data.step !== undefined) updates.onboardingStep = data.step;
    if (data.completed !== undefined) updates.onboardingCompleted = data.completed;
    if (data.industry) updates.industry = data.industry;
    if (data.role) updates.roleInCompany = data.role;
    if (data.firstName || data.lastName) {
        updates.fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
    }

    try {
        await db.update(users).set(updates).where(eq(users.id, session.user.id));
        revalidatePath("/onboarding");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function completeOnboarding() {
    const session = await getSessionWithRole();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        await db
            .update(users)
            .set({ onboardingCompleted: true, updatedAt: new Date() })
            .where(eq(users.id, session.user.id));
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
