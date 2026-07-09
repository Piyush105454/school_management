import { db } from "../src/db";
import { studentAttendance } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const d1 = new Date('2026-04-22'); // UTC midnight
    const d2 = new Date('2026-04-22T00:00:00+05:30'); // IST midnight (2026-04-21T18:30:00.000Z)
    
    console.log("UTC midnight d1:", d1.toISOString());
    console.log("IST midnight d2:", d2.toISOString());

    const records1 = await db.select().from(studentAttendance).where(eq(studentAttendance.date, d1)).limit(1);
    const records2 = await db.select().from(studentAttendance).where(eq(studentAttendance.date, d2)).limit(1);

    console.log("Records matching d1:", records1.length);
    console.log("Records matching d2:", records2.length);

  } catch(e) {
    console.error(e);
  }
}
run();
