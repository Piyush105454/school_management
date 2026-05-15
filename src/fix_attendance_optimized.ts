import { db } from "./db";
import { sql } from "drizzle-orm";

async function fixAttendance() {
  console.log("Fixing attendance records with NULL classId using a single SQL query...");
  
  try {
    const result = await db.execute(sql`
      UPDATE student_attendance 
      SET class_id = students.class_id 
      FROM students 
      WHERE student_attendance.student_id = students.id 
      AND student_attendance.class_id IS NULL;
    `);
    console.log("Attendance records fixed successfully!");
  } catch (error) {
    console.error("Error fixing attendance records:", error);
  }
}

fixAttendance().catch(console.error);
