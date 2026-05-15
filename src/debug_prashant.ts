import { db } from "./db";
import { students, studentAttendance } from "./db/schema";
import { eq, and, sql } from "drizzle-orm";

async function run() {
  const s = await db.query.students.findFirst({
    where: eq(students.name, "Prashant Chaudhary"),
  });
  if (s) {
    const stats = await db.select({
      total: sql`count(*)`,
      nonHNA: sql`count(case when status not in ('H', 'NA') then 1 end)`,
      present: sql`count(case when status in ('P', 'ML') then 1 end)`,
    }).from(studentAttendance).where(and(
      eq(studentAttendance.studentId, s.id),
      eq(studentAttendance.month, "April"),
      eq(studentAttendance.year, 2026)
    ));
    
    const rawStatuses = await db.select({ status: studentAttendance.status })
      .from(studentAttendance)
      .where(and(
        eq(studentAttendance.studentId, s.id),
        eq(studentAttendance.month, "April"),
        eq(studentAttendance.year, 2026)
      ));

    console.log("Stats for Prashant:", JSON.stringify(stats, null, 2));
    console.log("Raw Statuses:", rawStatuses.map(r => r.status).join(", "));
  } else {
    console.log("Student not found");
  }
}

run().catch(console.error);
