import { db } from "./db";
import { studentAttendance, students } from "./db/schema";
import { isNull, eq, isNotNull, and } from "drizzle-orm";

async function fixNullStudents() {
  console.log("Fixing students with NULL classId based on their attendance records...");
  
  const nullStudents = await db.select().from(students).where(isNull(students.classId));
  console.log(`Found ${nullStudents.length} students to fix.`);

  let fixedCount = 0;
  for (const student of nullStudents) {
    // Find any attendance record for this student that has a classId
    const attendance = await db.select()
      .from(studentAttendance)
      .where(and(eq(studentAttendance.studentId, student.id), isNotNull(studentAttendance.classId)))
      .limit(1);
    
    if (attendance.length > 0 && attendance[0].classId) {
      await db.update(students)
        .set({ classId: attendance[0].classId })
        .where(eq(students.id, student.id));
      fixedCount++;
    }
  }

  console.log(`Successfully fixed ${fixedCount} students.`);
}

fixNullStudents().catch(console.error);
