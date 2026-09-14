"use server";

import { db, tenants, users } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth, requirePermission } from "@/lib/rbac/guard";
import { hashPassword, verifyPassword, signSessionToken, setSessionCookie } from "@/lib/auth";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";
import type { AppRole } from "@/lib/types/database";
import { z } from "zod";

const organizationSchema = z.object({
    name: z.string().trim().min(2, "Business name must be at least 2 characters"),
    phoneNumber: z.string().trim().optional().nullable(),
    industry: z.string().trim().optional().nullable(),
    website: z.string().trim().url("Please enter a valid URL (e.g. https://example.com)").optional().or(z.literal("")),
    email: z.string().trim().email("Please enter a valid email address").optional().or(z.literal("")),
    address: z.string().trim().optional().nullable(),
    logoUrl: z.string().trim().optional().nullable(),
});

export interface OrganizationProfile {
    id: string;
    name: string;
    slug: string;
    phoneNumber: string | null;
    industry: string | null;
    website: string | null;
    email: string | null;
    address: string | null;
    logoUrl: string | null;
}

export async function getOrganizationProfile(): Promise<OrganizationProfile | null> {
    const session = await requireAuth();

    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, session.tenantId))
        .limit(1);

    if (!tenant) return null;

    const settings = (tenant.settings as Record<string, any>) || {};

    return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        phoneNumber: tenant.phoneNumber || null,
        industry: tenant.industry || "general",
        website: settings.website || null,
        email: settings.email || null,
        address: settings.address || null,
        logoUrl: settings.logoUrl || null,
    };
}

export async function updateOrganizationProfile(formData: {
    name: string;
    phoneNumber?: string;
    industry?: string;
    website?: string;
    email?: string;
    address?: string;
    logoUrl?: string;
}) {
    const session = await requirePermission("settings.write");

    const parseResult = organizationSchema.safeParse(formData);
    if (!parseResult.success) {
        return {
            success: false,
            error: parseResult.error.issues[0]?.message || "Invalid organization details",
        };
    }

    const validData = parseResult.data;

    try {
        const [currentTenant] = await db
            .select({ settings: tenants.settings })
            .from(tenants)
            .where(eq(tenants.id, session.tenantId))
            .limit(1);

        const existingSettings = (currentTenant?.settings as Record<string, any>) || {};

        const updatedSettings = {
            ...existingSettings,
            website: validData.website || null,
            email: validData.email || null,
            address: validData.address || null,
            logoUrl: validData.logoUrl || null,
        };

        await db
            .update(tenants)
            .set({
                name: validData.name,
                phoneNumber: validData.phoneNumber || null,
                industry: validData.industry || "general",
                settings: updatedSettings,
                updatedAt: new Date(),
            })
            .where(eq(tenants.id, session.tenantId));

        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update organization:", error);
        return { success: false, error: error.message || "Failed to save changes" };
    }
}

export interface UserProfileData {
    id: string;
    email: string;
    fullName: string | null;
    role: AppRole;
    tenantName: string;
    createdAt: string;
}

export async function getUserProfile(): Promise<UserProfileData | null> {
    const session = await requireAuth();

    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

    if (!user) return null;

    const [tenant] = await db
        .select({ name: tenants.name })
        .from(tenants)
        .where(eq(tenants.id, session.tenantId))
        .limit(1);

    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName || null,
        role: user.role as AppRole,
        tenantName: tenant?.name || "Workspace",
        createdAt: user.createdAt.toISOString(),
    };
}

export async function updateUserProfile(data: { fullName: string }) {
    const session = await requireAuth();

    const fullName = data.fullName.trim();
    if (!fullName) {
        return { success: false, error: "Full name cannot be empty" };
    }

    try {
        await db
            .update(users)
            .set({
                fullName,
                updatedAt: new Date(),
            })
            .where(eq(users.id, session.user.id));

        const [user] = await db
            .select({ tokenVersion: users.tokenVersion })
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1);

        // Refresh session token with updated name and current tokenVersion
        const token = await signSessionToken({
            userId: session.user.id,
            email: session.user.email,
            tenantId: session.tenantId,
            role: session.role,
            fullName,
            tokenVersion: user?.tokenVersion ?? 1,
        });
        await setSessionCookie(token);

        revalidatePath("/dashboard/settings/account");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update profile" };
    }
}

export async function changeUserPassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}) {
    const session = await requireAuth();

    if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
        return { success: false, error: "All password fields are required" };
    }

    if (data.newPassword.length < 8) {
        return { success: false, error: "New password must be at least 8 characters" };
    }

    if (data.newPassword !== data.confirmPassword) {
        return { success: false, error: "New passwords do not match" };
    }

    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

    if (!user || !user.passwordHash) {
        return { success: false, error: "User account not found" };
    }

    const isValid = await verifyPassword(data.currentPassword, user.passwordHash);
    if (!isValid) {
        return { success: false, error: "Current password is incorrect" };
    }

    try {
        const newHash = await hashPassword(data.newPassword);
        const nextTokenVersion = (user.tokenVersion ?? 1) + 1;

        await db
            .update(users)
            .set({
                passwordHash: newHash,
                tokenVersion: nextTokenVersion,
                updatedAt: new Date(),
            })
            .where(eq(users.id, session.user.id));

        // Re-issue cookie with nextTokenVersion so this device stays logged in
        // while all other devices/stolen tokens are immediately invalidated
        const token = await signSessionToken({
            userId: session.user.id,
            email: session.user.email,
            tenantId: session.tenantId,
            role: session.role,
            fullName: session.user.full_name,
            tokenVersion: nextTokenVersion,
        });
        await setSessionCookie(token);

        await logAuditEvent({
            tenantId: session.tenantId,
            userId: session.user.id,
            action: AUDIT_ACTIONS.PASSWORD_CHANGED,
            resourceType: "user",
            resourceId: session.user.id,
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to change password" };
    }
}
