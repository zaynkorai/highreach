"use server";

import { db, tenants, users, tenantMembers } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, signSessionToken, setSessionCookie, clearSessionCookie } from "./index";
import type { AppRole } from "@/lib/types/database";

export async function loginAction(formData: FormData) {
    try {
        const email = (formData.get("email") as string)?.toLowerCase().trim();
        const password = formData.get("password") as string;

        if (!email || !password) {
            return { success: false, error: "Email and password are required" };
        }

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user || !user.passwordHash) {
            return { success: false, error: "Invalid email or password" };
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return { success: false, error: "Invalid email or password" };
        }

        if (!user.tenantId) {
            return { success: false, error: "User has no tenant assigned" };
        }

        const token = await signSessionToken({
            userId: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role as AppRole,
            fullName: user.fullName,
        });

        await setSessionCookie(token);

        return { success: true };
    } catch (error: any) {
        console.error("Login error:", error);
        return { success: false, error: "Failed to log in. Please try again." };
    }
}

export async function signupAction(formData: FormData) {
    try {
        const email = (formData.get("email") as string)?.toLowerCase().trim();
        const password = formData.get("password") as string;
        const businessName = (formData.get("businessName") as string)?.trim();
        const fullName = (formData.get("fullName") as string)?.trim() || null;

        if (!email || !password || !businessName) {
            return { success: false, error: "All fields are required" };
        }

        if (password.length < 8) {
            return { success: false, error: "Password must be at least 8 characters" };
        }

        // Check if email already exists
        const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUser) {
            return { success: false, error: "An account with this email already exists" };
        }

        const hashedPassword = await hashPassword(password);
        const cleanSlug = businessName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
        const uniqueSlug = `${cleanSlug}-${Date.now().toString(36)}`;

        // Transaction to create tenant, user, and tenant membership
        const result = await db.transaction(async (tx) => {
            const [newTenant] = await tx
                .insert(tenants)
                .values({
                    name: businessName,
                    slug: uniqueSlug,
                })
                .returning();

            const [newUser] = await tx
                .insert(users)
                .values({
                    tenantId: newTenant.id,
                    email,
                    passwordHash: hashedPassword,
                    fullName,
                    role: "owner",
                })
                .returning();

            await tx.insert(tenantMembers).values({
                tenantId: newTenant.id,
                userId: newUser.id,
                role: "owner",
                acceptedAt: new Date(),
            });

            return { tenant: newTenant, user: newUser };
        });

        const token = await signSessionToken({
            userId: result.user.id,
            email: result.user.email,
            tenantId: result.tenant.id,
            role: "owner",
            fullName: result.user.fullName,
        });

        await setSessionCookie(token);

        return { success: true };
    } catch (error: any) {
        if (error.code === "23505") {
            return { success: false, error: "An account with this email already exists" };
        }
        console.error("Signup error:", error);
        return { success: false, error: "Failed to create account. Please try again." };
    }
}

export async function logoutAction() {
    await clearSessionCookie();
    return { success: true };
}
