import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function check() {
  try {
    const tables = await db.execute(sql`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`);
    console.log("Tables in database:", tables.rows);
    
    const enums = await db.execute(sql`SELECT typname FROM pg_type WHERE typcategory = 'E'`);
    console.log("Enums in database:", enums.rows);
  } catch (err) {
    console.error("Error checking database:", err);
  }
}

check();
