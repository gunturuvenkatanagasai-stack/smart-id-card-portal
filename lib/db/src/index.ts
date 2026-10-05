import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export const db = pool
  ? drizzle(pool, { schema })
  : (new Proxy({}, {
      get(_target, prop) {
        throw new Error(`Database operation '${String(prop)}' unavailable: DATABASE_URL is not set.`);
      },
    }) as unknown as ReturnType<typeof drizzle<typeof schema>>);

export * from "./schema";

