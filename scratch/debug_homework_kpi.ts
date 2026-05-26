import "dotenv/config";
import { db } from "../src/db";
import { eq, and, sql, or } from "drizzle-orm";
import {
  admissionMeta, students, lessonPlans, homeworkSubmissions, studentProfiles
} from "../src/db/schema";

async function debug() {
  console.log("\n=== STEP 1: Sample admission metas ===");
  const metas = await db.query.admissionMeta.findMany({ limit: 5 });
  for (const m of metas) {
    console.log(`  admissionMeta.id=${m.id}  entryNumber=${m.entryNumber}  admissionNumber=${m.admissionNumber}  scholarNumber=${m.scholarNumber}`);
  }

  console.log("\n=== STEP 2: Sample students (academy table) ===");
  const studs = await db.query.students.findMany({ limit: 10 });
  for (const s of studs) {
    console.log(`  students.id=${s.id}  studentId=${s.studentId}  name=${s.name}  classId=${s.classId}`);
  }

  console.log("\n=== STEP 3: Try matching admissionMeta.entryNumber -> students.studentId ===");
  for (const m of metas) {
    const match = studs.find(s => s.studentId === m.entryNumber);
    console.log(`  entryNumber=${m.entryNumber}  -> match: ${match ? `students.id=${match.id} name=${match.name}` : "NO MATCH"}`);
  }

  console.log("\n=== STEP 4: Try matching admissionMeta.scholarNumber -> students.studentId ===");
  for (const m of metas) {
    const match = studs.find(s => s.studentId === m.scholarNumber);
    console.log(`  scholarNumber=${m.scholarNumber}  -> match: ${match ? `students.id=${match.id} name=${match.name}` : "NO MATCH"}`);
  }

  console.log("\n=== STEP 5: Try matching admissionMeta.admissionNumber -> students.studentId ===");
  for (const m of metas) {
    const match = studs.find(s => s.studentId === m.admissionNumber);
    console.log(`  admissionNumber=${m.admissionNumber}  -> match: ${match ? `students.id=${match.id} name=${match.name}` : "NO MATCH"}`);
  }

  console.log("\n=== STEP 6: Sample lessonPlans dates (to check LIKE pattern) ===");
  const lps = await db.query.lessonPlans.findMany({ limit: 5 });
  for (const lp of lps) {
    console.log(`  lessonPlan.id=${lp.id}  date=${lp.date}  classId=${lp.classId}`);
  }

  console.log("\n=== STEP 7: Sample homeworkSubmissions ===");
  const subs = await db.query.homeworkSubmissions.findMany({ limit: 10, with: { student: true, lessonPlan: true } });
  for (const s of subs) {
    console.log(`  submission.id=${s.id}  studentId=${s.studentId}  status=${s.status}  lessonPlanDate=${(s as any).lessonPlan?.date}`);
  }

  console.log("\n=== STEP 8: Count COMPLETED submissions per student ===");
  const completed = await db.select({
    studentId: homeworkSubmissions.studentId,
    count: sql<number>`count(*)`.mapWith(Number)
  })
  .from(homeworkSubmissions)
  .where(eq(homeworkSubmissions.status, "COMPLETED"))
  .groupBy(homeworkSubmissions.studentId);
  console.log("  Completed submissions by students.id:", completed);
}

debug().catch(console.error).finally(() => process.exit(0));
