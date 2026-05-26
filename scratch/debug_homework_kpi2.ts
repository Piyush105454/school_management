import "dotenv/config";
import { db } from "../src/db";
import { eq, and, sql, or, inArray } from "drizzle-orm";
import {
  admissionMeta, students, lessonPlans, homeworkSubmissions
} from "../src/db/schema";

async function debug() {
  // Step 1: Get the actual student who has completed homework
  console.log("\n=== Student with completed homework (id=281) ===");
  const hw281 = await db.query.students.findFirst({ where: eq(students.id, 281) });
  console.log("Student:", hw281);

  // Step 2: Find matching admissionMeta using ALL fields
  if (hw281) {
    console.log("\n=== Looking for admissionMeta matching studentId:", hw281.studentId, "===");
    const metaMatch = await db.query.admissionMeta.findFirst({
      where: or(
        eq(admissionMeta.entryNumber, hw281.studentId),
        eq(admissionMeta.admissionNumber, hw281.studentId),
        eq(admissionMeta.scholarNumber, hw281.studentId),
      )
    });
    console.log("admissionMeta match:", metaMatch);
  }

  // Step 3: Show the first 5 students that DO have admissionMeta matches
  console.log("\n=== All students with entryNumber range ADM-2627-0001 to 0010 ===");
  for (let i = 1; i <= 10; i++) {
    const padded = `ADM-2627-${String(i).padStart(4, '0')}`;
    const s = await db.query.students.findFirst({ where: eq(students.studentId, padded) });
    console.log(`  ${padded} -> students record:`, s ? `id=${s.id} name=${s.name} classId=${s.classId}` : "NOT FOUND in students table");
  }

  // Step 4: Check what lessonPlans exist for classId of student 281
  const hw281fresh = await db.query.students.findFirst({ where: eq(students.id, 281) });
  if (hw281fresh?.classId) {
    console.log(`\n=== LessonPlans for classId=${hw281fresh.classId} in May 2026 ===`);
    const lps = await db.select({ id: lessonPlans.id, date: lessonPlans.date, classId: lessonPlans.classId })
      .from(lessonPlans)
      .where(and(
        eq(lessonPlans.classId, hw281fresh.classId),
        sql`${lessonPlans.date} LIKE ${'2026-05%'}`
      ));
    console.log("Plans:", lps);
  }

  // Step 5: Check admissionMeta for student id=281 via studentProfiles join
  console.log("\n=== StudentProfiles linked to admissionMeta (entryNumber range) ===");
  const allMetas = await db.query.admissionMeta.findMany({
    limit: 20,
    columns: { id: true, entryNumber: true, admissionNumber: true, scholarNumber: true }
  });
  
  const studentIds = allMetas.map(m => m.entryNumber).filter(Boolean);
  const matchedStudents = await db.query.students.findMany({
    where: inArray(students.studentId, studentIds as string[])
  });
  
  console.log("admissionMeta entryNumbers:", studentIds);
  console.log("Matched students:", matchedStudents.map(s => ({ id: s.id, studentId: s.studentId, classId: s.classId, name: s.name })));
}

debug().catch(console.error).finally(() => process.exit(0));
