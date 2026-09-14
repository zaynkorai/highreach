import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from "../lib/auth/index.ts";
import {
    checkRateLimit,
    resetRateLimit,
    checkLoginRateLimit,
    checkSignupRateLimit,
    checkPasswordResetRateLimit,
} from "../lib/auth/rate-limit.ts";
import { hasPermission, hasAllPermissions } from "../lib/rbac/permissions.ts";
import type { AppRole } from "../lib/types/database.ts";

test("Authentication & Security Suite", async (t) => {
    await t.test("hashPassword & verifyPassword", async (st) => {
        await st.test("hashes password with bcrypt and verifies correctly", async () => {
            const plain = "SuperSecretPassword123!";
            const hash = await hashPassword(plain);

            assert.notEqual(plain, hash);
            assert.equal(hash.startsWith("$2"), true);

            const isMatch = await verifyPassword(plain, hash);
            assert.equal(isMatch, true);
        });

        await st.test("rejects invalid password against hash", async () => {
            const plain = "CorrectPassword123";
            const hash = await hashPassword(plain);

            const isMatch = await verifyPassword("WrongPassword!", hash);
            assert.equal(isMatch, false);
        });
    });

    await t.test("JWT Session Signing & Verification with tokenVersion", async (st) => {
        await st.test("signs and verifies token containing tokenVersion", async () => {
            const payload = {
                userId: "user-uuid-12345",
                email: "founder@example.com",
                tenantId: "tenant-uuid-67890",
                role: "owner" as AppRole,
                fullName: "Alice Founder",
                tokenVersion: 2,
            };

            const token = await signSessionToken(payload);
            assert.equal(typeof token, "string");
            assert.equal(token.split(".").length, 3); // Valid JWT structure

            const verified = await verifySessionToken(token);
            assert.notEqual(verified, null);
            if (verified) {
                assert.equal(verified.userId, payload.userId);
                assert.equal(verified.email, payload.email);
                assert.equal(verified.tenantId, payload.tenantId);
                assert.equal(verified.role, payload.role);
                assert.equal(verified.fullName, payload.fullName);
                assert.equal(verified.tokenVersion, 2);
            }
        });

        await st.test("defaults tokenVersion to 1 if omitted", async () => {
            const payload = {
                userId: "user-uuid-abc",
                email: "member@example.com",
                tenantId: "tenant-uuid-def",
                role: "member" as AppRole,
            };

            const token = await signSessionToken(payload);
            const verified = await verifySessionToken(token);
            assert.notEqual(verified, null);
            if (verified) {
                assert.equal(verified.tokenVersion, 1);
            }
        });

        await st.test("rejects tampered or malformed tokens", async () => {
            const invalidResult = await verifySessionToken("invalid.malformed.token");
            assert.equal(invalidResult, null);
        });

        await st.test("tokenVersion mismatch invalidation logic", async () => {
            const sessionPayload = {
                userId: "user-123",
                email: "user@test.com",
                tenantId: "tenant-123",
                role: "member" as AppRole,
                tokenVersion: 1, // Issued at version 1
            };

            const token = await signSessionToken(sessionPayload);
            const decoded = await verifySessionToken(token);

            // Simulate user changing password in database -> token_version bumped to 2
            const dbUser = {
                id: "user-123",
                tokenVersion: 2,
            };

            const isTokenValid = decoded && dbUser.tokenVersion === decoded.tokenVersion;
            assert.equal(isTokenValid, false, "Token version 1 must be rejected when DB version is 2");
        });
    });

    await t.test("Sliding-Window Rate Limiter", async (st) => {
        const testKey = "test-rate-limit-key-" + Date.now();

        await st.test("allows attempts under maximum threshold", () => {
            resetRateLimit(testKey);
            const r1 = checkRateLimit(testKey, 3, 10000);
            assert.equal(r1.allowed, true);
            assert.equal(r1.remaining, 2);

            const r2 = checkRateLimit(testKey, 3, 10000);
            assert.equal(r2.allowed, true);
            assert.equal(r2.remaining, 1);

            const r3 = checkRateLimit(testKey, 3, 10000);
            assert.equal(r3.allowed, true);
            assert.equal(r3.remaining, 0);
        });

        await st.test("blocks attempts exceeding threshold", () => {
            const r4 = checkRateLimit(testKey, 3, 10000);
            assert.equal(r4.allowed, false);
            assert.equal(r4.remaining, 0);
            assert.equal(r4.retryAfterSeconds > 0, true);
        });

        await st.test("resetRateLimit unblocks the key", () => {
            resetRateLimit(testKey);
            const fresh = checkRateLimit(testKey, 3, 10000);
            assert.equal(fresh.allowed, true);
            assert.equal(fresh.remaining, 2);
        });

        await st.test("endpoint-specific rate limit helpers", () => {
            const email = "test-auth-user@example.com";
            resetRateLimit(`login:${email}`);
            const loginRes = checkLoginRateLimit(email);
            assert.equal(loginRes.allowed, true);

            resetRateLimit(`signup:${email}`);
            const signupRes = checkSignupRateLimit(email);
            assert.equal(signupRes.allowed, true);

            resetRateLimit(`pwd-reset:${email}`);
            const resetRes = checkPasswordResetRateLimit(email);
            assert.equal(resetRes.allowed, true);
        });
    });

    await t.test("RBAC Roles & Permissions Integrity", async (st) => {
        await st.test("owner has full access including billing and team management", () => {
            assert.equal(hasPermission("owner", "billing.read"), true);
            assert.equal(hasPermission("owner", "billing.write"), true);
            assert.equal(hasPermission("owner", "team.invite"), true);
            assert.equal(hasPermission("owner", "team.remove"), true);
            assert.equal(hasPermission("owner", "contacts.write"), true);
        });

        await st.test("admin can view billing but cannot edit billing or perform owner-only billing writes", () => {
            assert.equal(hasPermission("admin", "billing.read"), true);
            assert.equal(hasPermission("admin", "billing.write"), false);
            assert.equal(hasPermission("admin", "team.invite"), true);
            assert.equal(hasPermission("admin", "contacts.write"), true);
        });

        await st.test("member has restricted read/write access and cannot invite", () => {
            assert.equal(hasPermission("member", "team.invite"), false);
            assert.equal(hasPermission("member", "billing.read"), false);
            assert.equal(hasPermission("member", "settings.write"), false);
            assert.equal(hasPermission("member", "contacts.read"), true);
        });

        await st.test("hasAllPermissions checks conjunction of required permissions", () => {
            assert.equal(hasAllPermissions("owner", ["contacts.read", "contacts.write"]), true);
            assert.equal(hasAllPermissions("member", ["contacts.read", "team.invite"]), false);
        });
    });
});
