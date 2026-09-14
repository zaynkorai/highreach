"use server";

import { db, tenants, users, tenantMembers, tenantInvitations, passwordResetTokens } from "@/lib/db";
import { eq, and, isNull, sql } from "drizzle-orm";
import {
    hashPassword,
    verifyPassword,
    signSessionToken,
    setSessionCookie,
    clearSessionCookie,
    getCurrentSession,
} from "./index";
import {
    checkLoginRateLimit,
    checkSignupRateLimit,
    checkPasswordResetRateLimit,
    resetRateLimit,
} from "./rate-limit";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";
import { resend } from "@/lib/resend";
import type { AppRole } from "@/lib/types/database";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginAction(formData: FormData) {
    try {
        const email = (formData.get("email") as string)?.toLowerCase().trim();
        const password = formData.get("password") as string;

        if (!email || !password) {
            return { success: false, error: "Email and password are required" };
        }

        // Rate limiting: 5 attempts per 15 mins
        const limit = checkLoginRateLimit(email);
        if (!limit.allowed) {
            return {
                success: false,
                error: `Too many failed attempts. Please wait ${limit.retryAfterSeconds} seconds before trying again.`,
            };
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

        // Reset rate limiter on successful authentication
        resetRateLimit(`login:${email}`);

        const currentTokenVersion = user.tokenVersion ?? 1;

        const token = await signSessionToken({
            userId: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role as AppRole,
            fullName: user.fullName,
            tokenVersion: currentTokenVersion,
        });

        await setSessionCookie(token);

        await logAuditEvent({
            tenantId: user.tenantId,
            userId: user.id,
            action: AUDIT_ACTIONS.USER_SIGNED_IN,
            resourceType: "user",
            resourceId: user.id,
        });

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
        const confirmPassword = (formData.get("confirmPassword") as string) || "";
        const businessName = (formData.get("businessName") as string)?.trim();
        const fullName = (formData.get("fullName") as string)?.trim() || null;
        const inviteToken = (formData.get("inviteToken") as string)?.trim();

        if (!email || !EMAIL_REGEX.test(email)) {
            return { success: false, error: "Please enter a valid email address" };
        }

        // Rate limiting
        const limit = checkSignupRateLimit(email);
        if (!limit.allowed) {
            return {
                success: false,
                error: `Too many signup attempts. Please wait ${limit.retryAfterSeconds} seconds before trying again.`,
            };
        }

        if (confirmPassword && password !== confirmPassword) {
            return { success: false, error: "Passwords do not match" };
        }

        // ── Handle Team Invitation Signup ──
        if (inviteToken) {
            if (!password) {
                return { success: false, error: "Password is required" };
            }
            if (password.length < 8) {
                return { success: false, error: "Password must be at least 8 characters" };
            }

            const [invitation] = await db
                .select()
                .from(tenantInvitations)
                .where(
                    and(
                        eq(tenantInvitations.token, inviteToken),
                        isNull(tenantInvitations.acceptedAt)
                    )
                )
                .limit(1);

            if (!invitation) {
                return { success: false, error: "Invitation is invalid or has already been accepted" };
            }

            if (new Date(invitation.expiresAt) < new Date()) {
                return { success: false, error: "This invitation has expired" };
            }

            const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
            if (existingUser) {
                return { success: false, error: "An account with this email already exists. Please log in." };
            }

            const hashedPassword = await hashPassword(password);

            const result = await db.transaction(async (tx) => {
                const [newUser] = await tx
                    .insert(users)
                    .values({
                        tenantId: invitation.tenantId,
                        email,
                        passwordHash: hashedPassword,
                        fullName,
                        role: invitation.role,
                        tokenVersion: 1,
                        onboardingCompleted: true,
                    })
                    .returning();

                await tx.insert(tenantMembers).values({
                    tenantId: invitation.tenantId,
                    userId: newUser.id,
                    role: invitation.role,
                    invitedBy: invitation.invitedBy,
                    acceptedAt: new Date(),
                });

                await tx
                    .update(tenantInvitations)
                    .set({ acceptedAt: new Date() })
                    .where(eq(tenantInvitations.id, invitation.id));

                return { user: newUser, tenantId: invitation.tenantId, role: invitation.role as AppRole };
            });

            const token = await signSessionToken({
                userId: result.user.id,
                email: result.user.email,
                tenantId: result.tenantId,
                role: result.role,
                fullName: result.user.fullName,
                tokenVersion: 1,
            });

            await setSessionCookie(token);

            await logAuditEvent({
                tenantId: result.tenantId,
                userId: result.user.id,
                action: AUDIT_ACTIONS.USER_SIGNED_UP,
                resourceType: "user",
                resourceId: result.user.id,
                metadata: { role: result.role, invited: true },
            });

            return { success: true };
        }

        // ── Regular Tenant Owner Signup ──
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
                    tokenVersion: 1,
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
            tokenVersion: 1,
        });

        await setSessionCookie(token);

        await logAuditEvent({
            tenantId: result.tenant.id,
            userId: result.user.id,
            action: AUDIT_ACTIONS.USER_SIGNED_UP,
            resourceType: "user",
            resourceId: result.user.id,
            metadata: { businessName },
        });

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
    const session = await getCurrentSession();
    if (session?.userId && session?.tenantId) {
        await logAuditEvent({
            tenantId: session.tenantId,
            userId: session.userId,
            action: AUDIT_ACTIONS.USER_SIGNED_OUT,
            resourceType: "user",
            resourceId: session.userId,
        });
    }
    await clearSessionCookie();
    return { success: true };
}

/**
 * Request password reset email for an account.
 * Implements anti-enumeration (returns generic success even if user not found).
 */
export async function requestPasswordResetAction(formData: FormData) {
    try {
        const email = (formData.get("email") as string)?.toLowerCase().trim();

        if (!email || !EMAIL_REGEX.test(email)) {
            return { success: false, error: "Please enter a valid email address" };
        }

        // Rate limiting
        const limit = checkPasswordResetRateLimit(email);
        if (!limit.allowed) {
            return {
                success: false,
                error: `Too many password reset requests. Please wait ${limit.retryAfterSeconds} seconds.`,
            };
        }

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        // Even if user not found, return generic success to avoid email enumeration
        if (!user) {
            return {
                success: true,
                message: "If an account exists with this email, you will receive password reset instructions shortly.",
            };
        }

        // Delete any existing unused reset tokens for this user
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

        const resetToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

        await db.insert(passwordResetTokens).values({
            userId: user.id,
            token: resetToken,
            expiresAt,
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

        if (user.tenantId) {
            await logAuditEvent({
                tenantId: user.tenantId,
                userId: user.id,
                action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
                resourceType: "user",
                resourceId: user.id,
            });
        }

        // Send email via Resend if key is configured
        if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_placeholder_for_build") {
            try {
                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || "HighReach <onboarding@resend.dev>",
                    to: email,
                    subject: "Reset your HighReach password",
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
                            <h2 style="color: #111; margin-bottom: 16px;">Reset Your HighReach Password</h2>
                            <p style="color: #444; font-size: 15px; line-height: 1.5;">
                                A password reset request was received for your HighReach account. Click the button below to choose a new password.
                            </p>
                            <div style="margin: 28px 0;">
                                <a href="${resetUrl}" style="background-color: #d94826; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                                    Reset Password
                                </a>
                            </div>
                            <p style="color: #888; font-size: 13px; line-height: 1.4;">
                                This link will expire in 60 minutes. If you did not request this, you can safely ignore this email.<br/>
                                Link URL: <a href="${resetUrl}" style="color: #d94826;">${resetUrl}</a>
                            </p>
                        </div>
                    `,
                });
            } catch (mailErr) {
                console.warn("Could not dispatch password reset email via Resend:", mailErr);
            }
        } else {
            console.log(`[HighReach Dev Auth] Password reset link for ${email}: ${resetUrl}`);
        }

        return {
            success: true,
            message: "If an account exists with this email, you will receive password reset instructions shortly.",
        };
    } catch (error: any) {
        console.error("Password reset request error:", error);
        return { success: false, error: "An unexpected error occurred. Please try again." };
    }
}

/**
 * Execute password reset using a valid reset token.
 */
export async function resetPasswordAction(formData: FormData) {
    try {
        const token = (formData.get("token") as string)?.trim();
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (!token) {
            return { success: false, error: "Invalid or missing reset token" };
        }

        if (!password || password.length < 8) {
            return { success: false, error: "Password must be at least 8 characters" };
        }

        if (password !== confirmPassword) {
            return { success: false, error: "Passwords do not match" };
        }

        // Look up token
        const [tokenRecord] = await db
            .select()
            .from(passwordResetTokens)
            .where(
                and(
                    eq(passwordResetTokens.token, token),
                    isNull(passwordResetTokens.usedAt)
                )
            )
            .limit(1);

        if (!tokenRecord) {
            return { success: false, error: "This password reset link is invalid or has already been used" };
        }

        if (new Date(tokenRecord.expiresAt) < new Date()) {
            return { success: false, error: "This password reset link has expired" };
        }

        const [user] = await db.select().from(users).where(eq(users.id, tokenRecord.userId)).limit(1);
        if (!user || !user.tenantId) {
            return { success: false, error: "User account not found" };
        }

        const hashedPassword = await hashPassword(password);
        const nextTokenVersion = (user.tokenVersion ?? 1) + 1;

        await db.transaction(async (tx) => {
            // Update password hash and bump tokenVersion (revokes all prior sessions)
            await tx
                .update(users)
                .set({
                    passwordHash: hashedPassword,
                    tokenVersion: nextTokenVersion,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, user.id));

            // Mark token as used
            await tx
                .update(passwordResetTokens)
                .set({ usedAt: new Date() })
                .where(eq(passwordResetTokens.id, tokenRecord.id));
        });

        // Issue new session cookie with nextTokenVersion
        const sessionToken = await signSessionToken({
            userId: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role as AppRole,
            fullName: user.fullName,
            tokenVersion: nextTokenVersion,
        });

        await setSessionCookie(sessionToken);

        await logAuditEvent({
            tenantId: user.tenantId,
            userId: user.id,
            action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
            resourceType: "user",
            resourceId: user.id,
        });

        return { success: true };
    } catch (error: any) {
        console.error("Reset password error:", error);
        return { success: false, error: "Failed to reset password. Please try again." };
    }
}
