import test from "node:test";
import assert from "node:assert/strict";
import { contactSchema } from "../lib/validations/contact.ts";

test("contactSchema validation tests", async (t) => {
    await t.test("accepts valid contact with all fields", () => {
        const result = contactSchema.safeParse({
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "+15551234567",
            tags: ["VIP", "Lead"],
            source: "manual",
        });
        assert.equal(result.success, true);
        if (result.success) {
            assert.equal(result.data.firstName, "John");
            assert.equal(result.data.lastName, "Doe");
            assert.equal(result.data.email, "john.doe@example.com");
            assert.equal(result.data.phone, "+15551234567");
        }
    });

    await t.test("accepts contact with only required firstName", () => {
        const result = contactSchema.safeParse({
            firstName: "Jane",
        });
        assert.equal(result.success, true);
    });

    await t.test("rejects missing firstName", () => {
        const result = contactSchema.safeParse({
            lastName: "Smith",
            email: "smith@example.com",
        });
        assert.equal(result.success, false);
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors;
            assert.ok(errors.firstName);
        }
    });

    await t.test("rejects empty string firstName", () => {
        const result = contactSchema.safeParse({
            firstName: "",
        });
        assert.equal(result.success, false);
    });

    await t.test("rejects invalid email format", () => {
        const result = contactSchema.safeParse({
            firstName: "Bob",
            email: "not-an-email",
        });
        assert.equal(result.success, false);
        if (!result.success) {
            assert.ok(result.error.flatten().fieldErrors.email);
        }
    });

    await t.test("allows empty email string as optional", () => {
        const result = contactSchema.safeParse({
            firstName: "Bob",
            email: "",
        });
        assert.equal(result.success, true);
    });

    await t.test("rejects invalid phone number", () => {
        const result = contactSchema.safeParse({
            firstName: "Alice",
            phone: "abc-invalid",
        });
        assert.equal(result.success, false);
        if (!result.success) {
            assert.ok(result.error.flatten().fieldErrors.phone);
        }
    });

    await t.test("accepts valid E.164 phone numbers", () => {
        const validPhones = ["+15551234567", "+442071838750", "15551234567"];
        for (const phone of validPhones) {
            const result = contactSchema.safeParse({
                firstName: "User",
                phone,
            });
            assert.equal(result.success, true, `Expected phone ${phone} to be valid`);
        }
    });
});
