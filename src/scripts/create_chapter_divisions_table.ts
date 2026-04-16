import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is missing in environment variables");
}

const db = drizzle(postgres(connectionString), { schema });

async function createChapterDivisionsTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chapter_divisions (
        id serial PRIMARY KEY,
        chapter_id integer NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
        page_start integer NOT NULL,
        page_end integer NOT NULL,
        order_no integer NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("✓ chapter_divisions table created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error creating table:", error);
    process.exit(1);
  }
}

createChapterDivisionsTable();
