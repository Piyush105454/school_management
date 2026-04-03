import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function verify() {
  const columns = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'admission_meta'
  `);
  console.log("Columns:", (columns as any).map((c: any) => c.column_name));
  process.exit(0);
}
verify();
