import { db } from "./db";
import { studentAttendance, students, classes } from "./db/schema";
import { isNull, eq } from "drizzle-orm";

async function fixAttendance() {
  console.log("Fixing attendance records with NULL classId...");
  
  // Fetch all students to get their class IDs
  const allStudents = await db.select().from(students);
  const studentClassMap = new Map(allStudents.map(s => [s.id, s.classId]));

  const nullRecords = await db.select().from(studentAttendance).where(isNull(studentAttendance.classId));
  console.log(`Found ${nullRecords.length} records to fix.`);

  let fixedCount = 0;
  for (const record of nullRecords) {
    if (record.studentId) {
      const classId = studentClassMap.get(record.studentId);
      if (classId) {
        await db.update(studentAttendance)
          .set({ classId: classId })
          .where(eq(studentAttendance.id, record.id));
        fixedCount++;
      }
    }
  }

  console.log(`Successfully fixed ${fixedCount} records.`);
}

fixAttendance().catch(console.error);
