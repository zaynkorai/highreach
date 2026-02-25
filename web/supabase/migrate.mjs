#!/usr/bin/env node

/**
 * Supabase Migration Runner
 *
 * Usage:
 *   node supabase/migrate.mjs            — apply pending migrations
 *   node supabase/migrate.mjs status     — list applied / pending
 *   node supabase/migrate.mjs create <n> — scaffold a new migration file
 *
 * Requires SUPABASE_DB_URL in .env (Supabase direct connection string).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── Paths ───────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

// ── Env ─────────────────────────────────────────────────────────
function loadEnv() {
    const envPath = path.resolve(__dirname, "..", ".env");
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
    }
}
loadEnv();

function requireDb() {
    const url = process.env.SUPABASE_DB_URL;
    if (!url) {
        console.error("❌  Missing SUPABASE_DB_URL in .env");
        console.error("   → Get it from Supabase Dashboard → Settings → Database → Connection string (URI)");
        process.exit(1);
    }
    return url;
}

// ── Helpers ─────────────────────────────────────────────────────
function getMigrationFiles() {
    return fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith(".sql"))
        .sort();
}

function today() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${dd}`;
}

function nextSeq(datePrefix) {
    const existing = getMigrationFiles().filter((f) => f.startsWith(datePrefix));
    let max = 0;
    for (const f of existing) {
        const match = f.match(new RegExp(`^${datePrefix}_(\\d+)_`));
        if (match) max = Math.max(max, parseInt(match[1], 10));
    }
    return String(max + 1).padStart(3, "0");
}

// ── Commands ────────────────────────────────────────────────────

async function ensureTable(client) {
    await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL       PRIMARY KEY,
      name       TEXT         UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ  DEFAULT NOW()
    );
  `);
}

async function getApplied(client) {
    const { rows } = await client.query(
        "SELECT name FROM _migrations ORDER BY name"
    );
    return new Set(rows.map((r) => r.name));
}

// ── status ──────────────────────────────────────────────────────
async function status() {
    const pg = await import("pg");
    const client = new pg.default.Client({ connectionString: requireDb() });
    await client.connect();
    try {
        await ensureTable(client);
        const applied = await getApplied(client);
        const files = getMigrationFiles();

        console.log("\n📋  Migration Status\n");
        console.log("─".repeat(60));

        let pendingCount = 0;
        for (const f of files) {
            const done = applied.has(f);
            const icon = done ? "✅" : "⬚ ";
            if (!done) pendingCount++;
            console.log(`  ${icon}  ${f}`);
        }

        console.log("─".repeat(60));
        console.log(
            `  ${files.length} total · ${files.length - pendingCount} applied · ${pendingCount} pending\n`
        );
    } finally {
        await client.end();
    }
}

// ── migrate ─────────────────────────────────────────────────────
async function migrate() {
    const pg = await import("pg");
    const client = new pg.default.Client({ connectionString: requireDb() });
    await client.connect();
    try {
        await ensureTable(client);
        const applied = await getApplied(client);
        const files = getMigrationFiles();
        const pending = files.filter((f) => !applied.has(f));

        if (pending.length === 0) {
            console.log("\n✨  All migrations are up to date.\n");
            return;
        }

        console.log(`\n🚀  Applying ${pending.length} migration(s)...\n`);

        for (const file of pending) {
            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
            const start = performance.now();
            try {
                await client.query("BEGIN");
                await client.query(sql);
                await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
                await client.query("COMMIT");
                const ms = (performance.now() - start).toFixed(0);
                console.log(`  ✅  ${file}  (${ms}ms)`);
            } catch (err) {
                await client.query("ROLLBACK");
                console.error(`  ❌  ${file}`);
                console.error(`      ${err.message}`);
                process.exit(1);
            }
        }

        console.log(`\n✨  Done — ${pending.length} migration(s) applied.\n`);
    } finally {
        await client.end();
    }
}

// ── create ──────────────────────────────────────────────────────
function create(name) {
    if (!name) {
        console.error("❌  Usage: node supabase/migrate.mjs create <name>");
        console.error("   Example: node supabase/migrate.mjs create add_invoices_table");
        process.exit(1);
    }

    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");

    const datePrefix = today();
    const seq = nextSeq(datePrefix);
    const filename = `${datePrefix}_${seq}_${slug}.sql`;
    const filepath = path.join(MIGRATIONS_DIR, filename);

    const template = `-- =============================================================
-- Migration: ${slug.replace(/_/g, " ")}
-- =============================================================

-- Write your SQL here

`;

    fs.writeFileSync(filepath, template);
    console.log(`\n📄  Created: supabase/migrations/${filename}\n`);
}

// ── CLI ─────────────────────────────────────────────────────────
const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
    case "status":
        status().catch((e) => {
            console.error(e);
            process.exit(1);
        });
        break;
    case "create":
        create(args.join("_"));
        break;
    default:
        migrate().catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
