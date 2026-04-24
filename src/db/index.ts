import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

export const db = globalForDb.db ?? drizzle(
  postgres(connectionString, { 
    prepare: false,
    max: 10,
    idle_timeout: 30,
    connect_timeout: 30
  }), 
  { schema }
);

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
