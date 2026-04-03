import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("Checking columns in admission_meta...");
    const columns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'admission_meta'
    `);
    
    const columnNames = (columns as any).map((c: any) => c.column_name);
    console.log("Existing columns:", columnNames);

    if (!columnNames.includes("office_remarks")) {
      console.log("Adding office_remarks column...");
      await db.execute(sql`
        ALTER TABLE "admission_meta" ADD COLUMN "office_remarks" text;
      `);
      console.log("Column added successfully.");
    } else {
      console.log("Column office_remarks already exists.");
    }
  } catch (err) {
    console.error("Error updating database:", err);
  }
  process.exit(0);
}

run();
