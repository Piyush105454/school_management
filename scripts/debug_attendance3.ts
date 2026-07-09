import { db } from "../src/db";
import { studentAttendance } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const targetDateStr = '2026-04-22';
    
    const records = await db.select().from(studentAttendance)
      .where(sql`DATE(${studentAttendance.date}) = ${targetDateStr}`)
      .limit(5);

    console.log(`Records matching date cast ${targetDateStr}:`, records.length);
    if(records.length > 0) {
      console.log(records[0]);
    }

  } catch(e) {
    console.error(e);
  }
}
run();
