import { db } from "./src/db";
import { sql } from "drizzle-orm";
import fs from "fs";

async function check() {
  try {
    const res = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'parent_guardian_details';
    `);
    const cols = (res as any).rows.map((r: any) => r.column_name);
    fs.writeFileSync("db_columns_check.txt", "COLUMNS: " + cols.join(", "));
    process.exit(0);
  } catch(e: any) {
    fs.writeFileSync("db_columns_check.txt", "ERROR: " + e.message);
    process.exit(1);
  }
}
check();
