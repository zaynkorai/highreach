import test from "node:test";
import assert from "node:assert/strict";
import {
    getByDotNotation,
    formatTemplate,
    evaluateCondition,
    convertToWaitTime
} from "../lib/inngest/utils/helpers.ts";

test("Workflow Engine Helper Utilities", async (t) => {
    await t.test("getByDotNotation retrieves nested properties and aliases", () => {
        const context = {
            contact: {
                first_name: "Sarah",
                last_name: "Connor",
                email: "sarah@skynet.com",
                phone: "+15550199",
                leadSource: "Google Ads"
            }
        };

        // Basic direct paths
        assert.equal(getByDotNotation(context, "contact.first_name"), "Sarah");
        assert.equal(getByDotNotation(context, "contact.email"), "sarah@skynet.com");

        // Computed contact.name fallback
        assert.equal(getByDotNotation(context, "contact.name"), "Sarah Connor");

        // CamelCase / snake_case mapping
        assert.equal(getByDotNotation(context, "contact.lead_source"), "Google Ads");

        // Missing paths return undefined
        assert.equal(getByDotNotation(context, "contact.non_existent"), undefined);
        assert.equal(getByDotNotation(null, "contact.name"), undefined);
    });

    await t.test("formatTemplate interpolates variables accurately", () => {
        const context = {
            contact: {
                first_name: "John",
                last_name: "Doe",
                email: "john@example.com"
            }
        };

        const template = "Hello {{contact.first_name}}, we received your request at {{ contact.email }}. Full name: {{contact.name}}.";
        const rendered = formatTemplate(template, context);

        assert.equal(rendered, "Hello John, we received your request at john@example.com. Full name: John Doe.");

        // Unresolved variables remain untouched
        const partial = "Hi {{contact.first_name}}, code is {{unknown_code}}.";
        assert.equal(formatTemplate(partial, context), "Hi John, code is {{unknown_code}}.");
    });

    await t.test("evaluateCondition evaluates all comparison operators", () => {
        const context = {
            contact: {
                email: "lead@enterprise.com",
                first_name: "David",
                phone: "+15551234",
                source: "Facebook",
                notes: null,
                emptyField: ""
            },
            opportunity: {
                value: 15000,
                status: "open"
            }
        };

        // equals & not_equals
        assert.equal(evaluateCondition({ field: "contact.source", operator: "equals", value: "Facebook" }, context), true);
        assert.equal(evaluateCondition({ field: "contact.source", operator: "equals", value: "Google" }, context), false);
        assert.equal(evaluateCondition({ field: "contact.source", operator: "not_equals", value: "Google" }, context), true);

        // contains & not_contains
        assert.equal(evaluateCondition({ field: "contact.email", operator: "contains", value: "enterprise" }, context), true);
        assert.equal(evaluateCondition({ field: "contact.email", operator: "not_contains", value: "gmail" }, context), true);

        // starts_with & ends_with
        assert.equal(evaluateCondition({ field: "contact.phone", operator: "starts_with", value: "+1555" }, context), true);
        assert.equal(evaluateCondition({ field: "contact.email", operator: "ends_with", value: ".com" }, context), true);
        assert.equal(evaluateCondition({ field: "contact.email", operator: "ends_with", value: ".org" }, context), false);

        // numerical comparisons
        assert.equal(evaluateCondition({ field: "opportunity.value", operator: "greater_than", value: 10000 }, context), true);
        assert.equal(evaluateCondition({ field: "opportunity.value", operator: "greater_than", value: 20000 }, context), false);
        assert.equal(evaluateCondition({ field: "opportunity.value", operator: "less_than", value: "20000" }, context), true);

        // is_empty & is_not_empty
        assert.equal(evaluateCondition({ field: "contact.notes", operator: "is_empty" }, context), true);
        assert.equal(evaluateCondition({ field: "contact.emptyField", operator: "is_empty" }, context), true);
        assert.equal(evaluateCondition({ field: "contact.first_name", operator: "is_not_empty" }, context), true);
    });

    await t.test("convertToWaitTime parses durations into Inngest delay strings", () => {
        assert.equal(convertToWaitTime("10", "seconds"), "10s");
        assert.equal(convertToWaitTime(15, "minutes"), "15m");
        assert.equal(convertToWaitTime("2", "hours"), "2h");
        assert.equal(convertToWaitTime(3, "days"), "3d");
        assert.equal(convertToWaitTime("2", "weeks"), "2w");
        assert.equal(convertToWaitTime("invalid", "days"), "1d");
        assert.equal(convertToWaitTime(5, "unsupported_unit"), "5d");
    });

    await t.test("Graph traversal branching resolution simulation", () => {
        const conditionNode = {
            id: "node-cond-1",
            type: "if_else",
            data: { field: "contact.email", operator: "contains", value: "vip" }
        };

        const edges = [
            { source: "node-cond-1", sourceHandle: "yes", target: "node-send-vip" },
            { source: "node-cond-1", sourceHandle: "no", target: "node-send-regular" }
        ];

        // Matching context -> YES handle
        const vipContext = { contact: { email: "alice@vip.com" } };
        const vipResult = evaluateCondition(conditionNode.data, vipContext);
        const vipEdge = edges.find(e => e.sourceHandle === (vipResult ? "yes" : "no"));
        assert.equal(vipEdge?.target, "node-send-vip");

        // Non-matching context -> NO handle
        const regularContext = { contact: { email: "bob@standard.org" } };
        const regResult = evaluateCondition(conditionNode.data, regularContext);
        const regEdge = edges.find(e => e.sourceHandle === (regResult ? "yes" : "no"));
        assert.equal(regEdge?.target, "node-send-regular");
    });
});
