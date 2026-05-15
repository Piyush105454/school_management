import { db } from "./db";
import { studentAttendance, classes } from "./db/schema";
import { isNull, eq } from "drizzle-orm";

async function checkAttendance() {
  const nullClassRecords = await db.select().from(studentAttendance).where(isNull(studentAttendance.classId)).limit(5);
  console.log("Records with NULL classId:", JSON.stringify(nullClassRecords, null, 2));

  const count = await db.select().from(studentAttendance);
  console.log("Total attendance records:", count.length);

  const kg1Records = await db.select().from(studentAttendance).where(eq(studentAttendance.classId, 50)).limit(5);
  console.log("Records for KG1 (ID 50):", JSON.stringify(kg1Records, null, 2));
}

checkAttendance().catch(console.error);
