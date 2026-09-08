import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function getConnectionString(): string {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) {
        // Return dummy connection string during static builds if env is not yet set
        return "postgres://postgres:postgres@localhost:5432/highreach";
    }
    return url;
}

const globalForDb = globalThis as unknown as {
    pgPool: Pool | undefined;
};

export const pool =
    globalForDb.pgPool ??
    new Pool({
        connectionString: getConnectionString(),
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });

if (process.env.NODE_ENV !== "production") {
    globalForDb.pgPool = pool;
}

export const db = drizzle(pool, { schema });
export type Database = typeof db;
export * from "./schema";
