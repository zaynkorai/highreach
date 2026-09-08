import test from "node:test";
import assert from "node:assert/strict";
import { executeAction, successResponse, errorResponse } from "../lib/actions/action-response.ts";

test("action-handler envelope tests", async (t) => {
    await t.test("successResponse returns standard envelope", () => {
        const payload = { id: "123", name: "Test Item" };
        const response = successResponse(payload);
        assert.equal(response.success, true);
        if (response.success) {
            assert.deepEqual(response.data, payload);
        }
    });

    await t.test("errorResponse returns standard error envelope", () => {
        const response = errorResponse("Something failed", { code: 400 });
        assert.equal(response.success, false);
        if (!response.success) {
            assert.equal(response.error, "Something failed");
            assert.deepEqual(response.details, { code: 400 });
        }
    });

    await t.test("executeAction returns success when handler resolves", async () => {
        const response = await executeAction(async () => {
            return { message: "operation succeeded" };
        });
        assert.equal(response.success, true);
        if (response.success) {
            assert.equal(response.data.message, "operation succeeded");
        }
    });

    await t.test("executeAction captures Error exceptions into safe envelope", async () => {
        const response = await executeAction(async () => {
            throw new Error("Database timeout");
        });
        assert.equal(response.success, false);
        if (!response.success) {
            assert.equal(response.error, "Database timeout");
        }
    });

    await t.test("executeAction captures unknown throws safely", async () => {
        const response = await executeAction(async () => {
            throw "non-error-object";
        });
        assert.equal(response.success, false);
        if (!response.success) {
            assert.equal(response.error, "An unexpected error occurred");
        }
    });
});
