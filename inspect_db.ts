import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function inspect() {
  try {
    console.log("Inspecting parent_guardian_details columns...");
    const res = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parent_guardian_details';
    `);
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Error inspecting:", err);
    process.exit(1);
  }
}

inspect();
