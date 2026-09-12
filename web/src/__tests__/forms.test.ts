import test from "node:test";
import assert from "node:assert/strict";
import type { FormField } from "../types/form.ts";

// 1. Validation Logic
function validateFormField(field: FormField, rawValue: any): string | null {
    if (field.required) {
        const isEmpty = Array.isArray(rawValue)
            ? rawValue.length === 0
            : (!rawValue || String(rawValue).trim() === "");
        if (isEmpty) {
            return `"${field.label}" is required.`;
        }
    }

    if (rawValue !== null && rawValue !== undefined && rawValue !== "") {
        const strVal = String(rawValue);

        if (field.type === "number") {
            const num = Number(strVal);
            if (isNaN(num)) {
                return `"${field.label}" must be a valid number.`;
            }
            if (field.validation?.min !== undefined && num < field.validation.min) {
                return `"${field.label}" must be at least ${field.validation.min}.`;
            }
            if (field.validation?.max !== undefined && num > field.validation.max) {
                return `"${field.label}" cannot exceed ${field.validation.max}.`;
            }
        }

        if (field.type === "text" || field.type === "textarea") {
            if (field.validation?.min !== undefined && strVal.length < field.validation.min) {
                return `"${field.label}" must be at least ${field.validation.min} characters.`;
            }
            if (field.validation?.max !== undefined && strVal.length > field.validation.max) {
                return `"${field.label}" cannot exceed ${field.validation.max} characters.`;
            }
            if (field.validation?.pattern) {
                try {
                    const regex = new RegExp(field.validation.pattern);
                    if (!regex.test(strVal)) {
                        return `"${field.label}" format is invalid.`;
                    }
                } catch {
                    // Ignore malformed regex
                }
            }
        }
    }

    return null;
}

// 2. Honeypot check
function isBotSubmission(formData: Map<string, any>): boolean {
    const honeypot = formData.get("_hp_company");
    return Boolean(honeypot && String(honeypot).trim() !== "");
}

// 3. Conditional logic evaluator
function checkCondition(condition: { fieldId: string; operator: string; value: string }, fieldValue: any): boolean {
    const val = condition.value?.toLowerCase() || "";
    const fieldVal = String(fieldValue || "").toLowerCase();

    switch (condition.operator) {
        case "equals":
            return fieldVal === val;
        case "not_equals":
            return fieldVal !== val;
        case "contains":
            return fieldVal.includes(val);
        case "greater_than": {
            const numField = parseFloat(fieldVal);
            const numTarget = parseFloat(val);
            return !isNaN(numField) && !isNaN(numTarget) && numField > numTarget;
        }
        case "less_than": {
            const numField = parseFloat(fieldVal);
            const numTarget = parseFloat(val);
            return !isNaN(numField) && !isNaN(numTarget) && numField < numTarget;
        }
        default:
            return false;
    }
}

function isFieldVisible(field: FormField, values: Record<string, any>): boolean {
    if (!field.logic || field.logic.length === 0) return true;
    let visible = !field.logic.some((r) => r.action === "show");
    for (const rule of field.logic) {
        const conditionsMet = rule.conditions.every((c) => checkCondition(c, values[c.fieldId]));
        if (conditionsMet) {
            if (rule.action === "show") visible = true;
            if (rule.action === "hide") visible = false;
        }
    }
    return visible;
}

// 4. CSV escape & row formatting
function formatCsvRow(values: (string | number | null | undefined)[]): string {
    return values
        .map((val) => {
            const str = val === null || val === undefined ? "" : String(val);
            return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",");
}

// 5. Conversion rate calculation
function calculateConversionRate(views: number | null | undefined, submissions: number | null | undefined): string {
    const v = views || 0;
    const s = submissions || 0;
    if (v <= 0) return "0%";
    return ((s / v) * 100).toFixed(1) + "%";
}

test("Forms System & Validation Unit Tests", async (t) => {
    // --- Test 1: Honeypot bot protection ---
    await t.test("Honeypot detects bot when _hp_company has content", () => {
        const botData = new Map<string, any>([
            ["_hp_company", "SpamCorp Inc"],
            ["name", "Bot User"],
        ]);
        assert.equal(isBotSubmission(botData), true);

        const legitimateData = new Map<string, any>([
            ["_hp_company", ""],
            ["name", "Real User"],
        ]);
        assert.equal(isBotSubmission(legitimateData), false);

        const noHoneypot = new Map<string, any>([["name", "Real User"]]);
        assert.equal(isBotSubmission(noHoneypot), false);
    });

    // --- Test 2: Required field validation ---
    await t.test("Rejects empty or missing required fields", () => {
        const requiredField: FormField = {
            id: "f1",
            type: "text",
            label: "Full Name",
            required: true,
        };

        assert.equal(validateFormField(requiredField, ""), '"Full Name" is required.');
        assert.equal(validateFormField(requiredField, "   "), '"Full Name" is required.');
        assert.equal(validateFormField(requiredField, null), '"Full Name" is required.');
        assert.equal(validateFormField(requiredField, undefined), '"Full Name" is required.');
        assert.equal(validateFormField(requiredField, "Jane Doe"), null);
    });

    await t.test("Accepts empty optional fields", () => {
        const optionalField: FormField = {
            id: "f2",
            type: "text",
            label: "Company Website",
            required: false,
        };

        assert.equal(validateFormField(optionalField, ""), null);
        assert.equal(validateFormField(optionalField, null), null);
        assert.equal(validateFormField(optionalField, "https://example.com"), null);
    });

    // --- Test 3: Number validation & constraints ---
    await t.test("Validates number field min and max limits", () => {
        const budgetField: FormField = {
            id: "f3",
            type: "number",
            label: "Monthly Budget",
            required: true,
            validation: { min: 100, max: 50000 },
        };

        assert.equal(validateFormField(budgetField, "not-a-number"), '"Monthly Budget" must be a valid number.');
        assert.equal(validateFormField(budgetField, "50"), '"Monthly Budget" must be at least 100.');
        assert.equal(validateFormField(budgetField, "60000"), '"Monthly Budget" cannot exceed 50000.');
        assert.equal(validateFormField(budgetField, "100"), null);
        assert.equal(validateFormField(budgetField, "25000"), null);
        assert.equal(validateFormField(budgetField, "50000"), null);
    });

    // --- Test 4: Text length and regex constraints ---
    await t.test("Validates text character lengths and regex pattern", () => {
        const zipField: FormField = {
            id: "f4",
            type: "text",
            label: "US Zip Code",
            required: true,
            validation: { min: 5, max: 10, pattern: "^\\d{5}(-\\d{4})?$" },
        };

        assert.equal(validateFormField(zipField, "123"), '"US Zip Code" must be at least 5 characters.');
        assert.equal(validateFormField(zipField, "123456789012"), '"US Zip Code" cannot exceed 10 characters.');
        assert.equal(validateFormField(zipField, "ABCDE"), '"US Zip Code" format is invalid.');
        assert.equal(validateFormField(zipField, "90210"), null);
        assert.equal(validateFormField(zipField, "90210-1234"), null);
    });

    // --- Test 5: Checkbox array handling ---
    await t.test("Validates multi-checkbox selections", () => {
        const checkboxField: FormField = {
            id: "f5",
            type: "checkbox",
            label: "Services Interested In",
            required: true,
            options: [
                { label: "SEO", value: "SEO" },
                { label: "Web Design", value: "Web Design" },
                { label: "Paid Ads", value: "Paid Ads" },
            ],
        };

        assert.equal(validateFormField(checkboxField, []), '"Services Interested In" is required.');
        assert.equal(validateFormField(checkboxField, ["SEO", "Web Design"]), null);
    });

    // --- Test 6: Conditional logic engine ---
    await t.test("Evaluates conditional logic operators accurately", () => {
        // equals
        assert.equal(checkCondition({ fieldId: "role", operator: "equals", value: "manager" }, "Manager"), true);
        assert.equal(checkCondition({ fieldId: "role", operator: "equals", value: "director" }, "Manager"), false);

        // not_equals
        assert.equal(checkCondition({ fieldId: "role", operator: "not_equals", value: "director" }, "Manager"), true);

        // contains
        assert.equal(checkCondition({ fieldId: "email", operator: "contains", value: "@gmail.com" }, "user@gmail.com"), true);
        assert.equal(checkCondition({ fieldId: "email", operator: "contains", value: "@company.com" }, "user@gmail.com"), false);

        // greater_than
        assert.equal(checkCondition({ fieldId: "budget", operator: "greater_than", value: "1000" }, "2500"), true);
        assert.equal(checkCondition({ fieldId: "budget", operator: "greater_than", value: "5000" }, "2500"), false);

        // less_than
        assert.equal(checkCondition({ fieldId: "budget", operator: "less_than", value: "5000" }, "2500"), true);
        assert.equal(checkCondition({ fieldId: "budget", operator: "less_than", value: "1000" }, "2500"), false);
    });

    await t.test("Evaluates field visibility rules dynamically", () => {
        const dependentField: FormField = {
            id: "f_details",
            type: "textarea",
            label: "Project Scope Details",
            required: false,
            logic: [
                {
                    id: "rule-1",
                    action: "show",
                    conditions: [
                        { fieldId: "budget", operator: "greater_than", value: "10000" }
                    ]
                }
            ]
        };

        // Budget is low -> hidden
        assert.equal(isFieldVisible(dependentField, { budget: "5000" }), false);

        // Budget is high -> shown
        assert.equal(isFieldVisible(dependentField, { budget: "15000" }), true);

        // Standalone field with no logic is always visible
        const normalField: FormField = {
            id: "f_email",
            type: "email",
            label: "Email",
            required: true,
        };
        assert.equal(isFieldVisible(normalField, {}), true);
    });

    // --- Test 7: CSV generation and escaping ---
    await t.test("CSV formatting properly escapes quotes, commas, and newlines", () => {
        const row = formatCsvRow([
            "sub-123",
            "Jane Doe",
            "jane@example.com",
            'Quote with "quotes" inside',
            "Comma, separated, value",
            "Line 1\nLine 2",
        ]);

        assert.equal(
            row,
            '"sub-123","Jane Doe","jane@example.com","Quote with ""quotes"" inside","Comma, separated, value","Line 1\nLine 2"'
        );
    });

    // --- Test 8: Conversion rate calculations ---
    await t.test("Conversion rate handles 0 views safely and calculates accurate percentages", () => {
        assert.equal(calculateConversionRate(0, 0), "0%");
        assert.equal(calculateConversionRate(0, 5), "0%");
        assert.equal(calculateConversionRate(null, null), "0%");
        assert.equal(calculateConversionRate(100, 25), "25.0%");
        assert.equal(calculateConversionRate(300, 100), "33.3%");
        assert.equal(calculateConversionRate(50, 5), "10.0%");
    });
});
