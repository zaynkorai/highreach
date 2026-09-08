import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "csv-parse/sync";
import { contactSchema } from "../lib/validations/contact.ts";

function parseAndValidateCsv(csvContent: string) {
    const rawData = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    }) as Array<Record<string, string>>;

    if (!rawData || rawData.length === 0) {
        throw new Error("No records found in CSV");
    }

    const validContacts: Array<{ firstName: string; lastName: string | null; email: string | null; phone: string | null }> = [];
    const failedRows: Array<{ row: number; errors: Record<string, string[] | undefined> }> = [];

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const mappedData = {
            firstName: row["firstName"] || row["First Name"] || row["first name"] || row["first_name"] || row["Name"] || row["name"],
            lastName: row["lastName"] || row["Last Name"] || row["last name"] || row["last_name"] || "",
            email: row["email"] || row["Email"] || row["E-mail"] || "",
            phone: row["phone"] || row["Phone"] || row["Phone Number"] || row["phone_number"] || "",
        };

        const validated = contactSchema.safeParse(mappedData);
        if (validated.success) {
            validContacts.push({
                firstName: validated.data.firstName,
                lastName: validated.data.lastName || null,
                email: validated.data.email || null,
                phone: validated.data.phone || null,
            });
        } else {
            failedRows.push({
                row: i + 1,
                errors: validated.error.flatten().fieldErrors,
            });
        }
    }

    return { validContacts, failedRows };
}

test("CSV contact ingestion logic", async (t) => {
    await t.test("parses standard CSV with CamelCase headers", () => {
        const csv = `firstName,lastName,email,phone\nJohn,Doe,john@example.com,+15551234567\nJane,Smith,jane@example.com,`;
        const { validContacts, failedRows } = parseAndValidateCsv(csv);

        assert.equal(validContacts.length, 2);
        assert.equal(failedRows.length, 0);
        assert.equal(validContacts[0].firstName, "John");
        assert.equal(validContacts[0].lastName, "Doe");
        assert.equal(validContacts[1].firstName, "Jane");
        assert.equal(validContacts[1].phone, null);
    });

    await t.test("parses CSV with natural space-separated headers", () => {
        const csv = `First Name,Last Name,Email,Phone Number\nAlice,Wonderland,alice@wonder.com,+15559876543`;
        const { validContacts, failedRows } = parseAndValidateCsv(csv);

        assert.equal(validContacts.length, 1);
        assert.equal(failedRows.length, 0);
        assert.equal(validContacts[0].firstName, "Alice");
        assert.equal(validContacts[0].email, "alice@wonder.com");
    });

    await t.test("tracks invalid rows without failing entire batch", () => {
        const csv = `First Name,Email\nValid Person,valid@example.com\n,missing-name@example.com\nInvalid Email,bad-email`;
        const { validContacts, failedRows } = parseAndValidateCsv(csv);

        assert.equal(validContacts.length, 1);
        assert.equal(validContacts[0].firstName, "Valid Person");
        assert.equal(failedRows.length, 2);
        assert.equal(failedRows[0].row, 2); // Row 2 (missing first name)
        assert.ok(failedRows[0].errors.firstName);
        assert.equal(failedRows[1].row, 3); // Row 3 (bad email)
        assert.ok(failedRows[1].errors.email);
    });

    await t.test("throws error when CSV is empty", () => {
        assert.throws(() => parseAndValidateCsv(""), {
            message: "No records found in CSV",
        });
    });
});
