import { db } from "../src/db";
import { studentAttendance } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const records = await db.select().from(studentAttendance);
    console.log("Total records:", records.length);
    if (records.length > 0) {
      console.log("Sample records:", records.slice(0, 5));
    }
  } catch(e) {
    console.error(e);
  }
}
run();
