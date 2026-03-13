import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function check() {
  try {
    const tables = ['users', 'student_profiles', 'admission_meta', 'entrance_tests'];
    for (const table of tables) {
      console.log(`\nColumns for ${table}:`);
      const result = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${table}
      `);
      console.log(JSON.stringify(result.rows, null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

check();
