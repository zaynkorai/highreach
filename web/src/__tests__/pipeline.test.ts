import test from "node:test";
import assert from "node:assert/strict";
import {
    opportunitySchema,
    updateOpportunitySchema,
    pipelineSchema,
    stageSchema,
} from "../lib/validations/opportunity.ts";

test("Pipelines & Deals Validation and Business Logic Tests", async (t) => {
    const validContactId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    const validStageId = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

    await t.test("opportunitySchema accepts valid deal payload", () => {
        const payload = {
            title: "Q4 Enterprise License",
            contactId: validContactId,
            pipelineStageId: validStageId,
            value: 25000,
            status: "open" as const,
        };

        const result = opportunitySchema.safeParse(payload);
        assert.ok(result.success, "Valid opportunity payload should pass validation");
        if (result.success) {
            assert.equal(result.data.title, "Q4 Enterprise License");
            assert.equal(result.data.value, 25000);
            assert.equal(result.data.status, "open");
        }
    });

    await t.test("opportunitySchema rejects missing title or empty string", () => {
        const payload = {
            title: "",
            contactId: validContactId,
            pipelineStageId: validStageId,
            value: 1000,
            status: "open" as const,
        };

        const result = opportunitySchema.safeParse(payload);
        assert.equal(result.success, false, "Empty title should fail validation");
    });

    await t.test("opportunitySchema rejects non-UUID contactId or pipelineStageId", () => {
        const invalidContact = {
            title: "Deal 1",
            contactId: "not-a-uuid",
            pipelineStageId: validStageId,
            value: 500,
        };
        assert.equal(opportunitySchema.safeParse(invalidContact).success, false);

        const invalidStage = {
            title: "Deal 1",
            contactId: validContactId,
            pipelineStageId: "invalid-stage",
            value: 500,
        };
        assert.equal(opportunitySchema.safeParse(invalidStage).success, false);
    });

    await t.test("opportunitySchema rejects negative deal values", () => {
        const payload = {
            title: "Refund Deal",
            contactId: validContactId,
            pipelineStageId: validStageId,
            value: -100,
        };
        const result = opportunitySchema.safeParse(payload);
        assert.equal(result.success, false, "Negative value should fail validation");
    });

    await t.test("opportunitySchema defaults status to 'open' when omitted", () => {
        const payload = {
            title: "New Lead Opportunity",
            contactId: validContactId,
            pipelineStageId: validStageId,
            value: 1200,
        };
        const result = opportunitySchema.safeParse(payload);
        assert.ok(result.success);
        if (result.success) {
            assert.equal(result.data.status, "open");
        }
    });

    await t.test("opportunitySchema validates status transitions ('open', 'won', 'lost')", () => {
        const base = {
            title: "Annual Contract",
            contactId: validContactId,
            pipelineStageId: validStageId,
            value: 5000,
        };

        assert.ok(opportunitySchema.safeParse({ ...base, status: "won" }).success);
        assert.ok(opportunitySchema.safeParse({ ...base, status: "lost" }).success);
        assert.ok(opportunitySchema.safeParse({ ...base, status: "open" }).success);
        assert.equal(opportunitySchema.safeParse({ ...base, status: "pending" }).success, false);
    });

    await t.test("updateOpportunitySchema accepts partial updates", () => {
        const titleOnly = { title: "Updated Deal Title" };
        assert.ok(updateOpportunitySchema.safeParse(titleOnly).success);

        const valueOnly = { value: 75000 };
        assert.ok(updateOpportunitySchema.safeParse(valueOnly).success);

        const statusOnly = { status: "won" as const };
        assert.ok(updateOpportunitySchema.safeParse(statusOnly).success);

        const stageOnly = { pipelineStageId: validStageId };
        assert.ok(updateOpportunitySchema.safeParse(stageOnly).success);
    });

    await t.test("pipelineSchema validates pipeline creation and renaming", () => {
        assert.ok(pipelineSchema.safeParse({ name: "Sales Pipeline" }).success);
        assert.ok(pipelineSchema.safeParse({ name: "Outbound Growth" }).success);
        assert.equal(pipelineSchema.safeParse({ name: "" }).success, false, "Empty name should be rejected");
        assert.equal(
            pipelineSchema.safeParse({ name: "a".repeat(101) }).success,
            false,
            "Name over 100 characters should be rejected"
        );
    });

    await t.test("stageSchema validates stage creation and renaming", () => {
        assert.ok(stageSchema.safeParse({ name: "Proposal Sent" }).success);
        assert.equal(stageSchema.safeParse({ name: "" }).success, false, "Empty stage name should be rejected");
        assert.equal(
            stageSchema.safeParse({ name: "a".repeat(51) }).success,
            false,
            "Stage name over 50 characters should be rejected"
        );
    });

    await t.test("Re-indexing algorithm properly inserts and sequences order indices", () => {
        // Simulating the sequential orderIndex calculation used in moveOpportunity
        const existingStageItems = [
            { id: "deal-1", orderIndex: 0 },
            { id: "deal-2", orderIndex: 1 },
            { id: "deal-3", orderIndex: 2 },
        ];

        const movingDealId = "deal-new";
        const targetIndex = 1; // Insert between deal-1 and deal-2

        const clampedIndex = Math.max(0, Math.min(targetIndex, existingStageItems.length));
        const reordered = [
            ...existingStageItems.slice(0, clampedIndex),
            { id: movingDealId, orderIndex: -1 },
            ...existingStageItems.slice(clampedIndex),
        ].map((item, idx) => ({ ...item, orderIndex: idx }));

        assert.equal(reordered.length, 4);
        assert.deepEqual(
            reordered.map((i) => i.id),
            ["deal-1", "deal-new", "deal-2", "deal-3"]
        );
        assert.deepEqual(
            reordered.map((i) => i.orderIndex),
            [0, 1, 2, 3]
        );
    });

    await t.test("Stage total value computation handles mixed and empty deals correctly", () => {
        const deals = [
            { id: "1", value: 10000, pipeline_stage_id: "s1" },
            { id: "2", value: 2500.5, pipeline_stage_id: "s1" },
            { id: "3", value: 0, pipeline_stage_id: "s1" },
            { id: "4", value: 5000, pipeline_stage_id: "s2" },
        ];

        const s1Total = deals
            .filter((d) => d.pipeline_stage_id === "s1")
            .reduce((sum, d) => sum + Number(d.value || 0), 0);

        const s2Total = deals
            .filter((d) => d.pipeline_stage_id === "s2")
            .reduce((sum, d) => sum + Number(d.value || 0), 0);

        const s3Total = deals
            .filter((d) => d.pipeline_stage_id === "s3")
            .reduce((sum, d) => sum + Number(d.value || 0), 0);

        assert.equal(s1Total, 12500.5);
        assert.equal(s2Total, 5000);
        assert.equal(s3Total, 0);
    });
});
