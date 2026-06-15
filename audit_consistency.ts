import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./src/db/schema";
import { sql } from "drizzle-orm";

const db = drizzle(
  postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 }),
  { schema }
);

async function main() {
  console.log("=".repeat(70));
  console.log("FULL PLATFORM DATA CONSISTENCY AUDIT");
  console.log("=".repeat(70));

  // ─── 1. Classes Table ───────────────────────────────────────────────────────
  console.log("\n📋 CLASSES TABLE");
  const classes = await db.query.classes.findMany();
  console.log(`  Total classes: ${classes.length}`);
  classes.forEach(c => console.log(`  id=${c.id}  name="${c.name}"  grade=${c.grade}  institute="${c.institute}"`));

  // Check for duplicate names (same name different casing or with/without "Class " prefix)
  const classNames = classes.map(c => ({ id: c.id, name: c.name, norm: c.name.replace(/^class\s+/i, "").trim().toLowerCase() }));
  const normMap: Record<string, typeof classNames> = {};
  for (const c of classNames) {
    if (!normMap[c.norm]) normMap[c.norm] = [];
    normMap[c.norm].push(c);
  }
  const duplicateClasses = Object.entries(normMap).filter(([, v]) => v.length > 1);
  if (duplicateClasses.length > 0) {
    console.log("\n  ⚠️  DUPLICATE/INCONSISTENT CLASS NAMES FOUND:");
    duplicateClasses.forEach(([norm, entries]) => {
      console.log(`     Normalized: "${norm}" → ${entries.map(e => `id=${e.id} name="${e.name}"`).join(" | ")}`);
    });
  } else {
    console.log("  ✅ No duplicate class names");
  }

  // ─── 2. Teachers classAssigned field ────────────────────────────────────────
  console.log("\n👩‍🏫 TEACHERS - classAssigned field");
  const teachers = await db.query.teachers.findMany();
  console.log(`  Total teachers: ${teachers.length}`);

  let teacherIssues = 0;
  for (const t of teachers) {
    if (!t.classAssigned) continue;
    const parts = t.classAssigned.split(",").map(x => x.trim()).filter(Boolean);

    // Check for duplicates within this teacher's assignment
    const norms = parts.map(p => p.replace(/^class\s+/i, "").trim().toLowerCase());
    const seen = new Set<string>();
    const hasDups = norms.some(n => { if (seen.has(n)) return true; seen.add(n); return false; });

    // Check if any assigned class name doesn't match a real class
    const unmatchedClasses: string[] = [];
    for (const part of parts) {
      const norm = part.replace(/^class\s+/i, "").trim().toLowerCase();
      const found = classes.some(c => c.name.replace(/^class\s+/i, "").trim().toLowerCase() === norm);
      if (!found) unmatchedClasses.push(part);
    }

    if (hasDups || unmatchedClasses.length > 0) {
      teacherIssues++;
      console.log(`  ⚠️  Teacher: "${t.name}" (id=${t.id})`);
      console.log(`       classAssigned = "${t.classAssigned}"`);
      if (hasDups) console.log(`       → HAS DUPLICATES: ${parts.join(" | ")}`);
      if (unmatchedClasses.length > 0) console.log(`       → UNMATCHED CLASSES: ${unmatchedClasses.join(", ")}`);
    }
  }
  if (teacherIssues === 0) console.log("  ✅ All teachers have consistent classAssigned values");

  // ─── 3. Students without a classId ──────────────────────────────────────────
  console.log("\n🎓 STUDENTS - classId check");
  const studentsNoClass = await db.execute(sql`SELECT id, name, student_id FROM students WHERE class_id IS NULL`);
  console.log(`  Students with NULL class_id: ${studentsNoClass.length}`);
  if (studentsNoClass.length > 0) {
    studentsNoClass.slice(0, 10).forEach((s: any) => console.log(`    id=${s.id} name="${s.name}" student_id=${s.student_id}`));
    if (studentsNoClass.length > 10) console.log(`    ... and ${studentsNoClass.length - 10} more`);
  }

  // Students with invalid classId (points to non-existent class)
  const classIds = new Set(classes.map(c => c.id));
  const allStudents = await db.execute(sql`SELECT id, name, student_id, class_id FROM students WHERE class_id IS NOT NULL`);
  const invalidClassStudents = (allStudents as any[]).filter(s => !classIds.has(s.class_id));
  console.log(`  Students with invalid class_id: ${invalidClassStudents.length}`);
  if (invalidClassStudents.length > 0) {
    invalidClassStudents.slice(0, 10).forEach((s: any) => console.log(`    id=${s.id} name="${s.name}" class_id=${s.class_id} (NOT IN classes table)`));
  }

  // ─── 4. Subjects - assignedTeacherId ────────────────────────────────────────
  console.log("\n📚 SUBJECTS - assignedTeacherId check");
  const teacherIds = new Set(teachers.map(t => t.id));
  const orphanSubjects = await db.execute(sql`
    SELECT s.id, s.name, s.assigned_teacher_id, c.name as class_name 
    FROM subjects s
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.assigned_teacher_id IS NOT NULL
  `);
  const orphanSubjectsFiltered = (orphanSubjects as any[]).filter(s => !teacherIds.has(s.assigned_teacher_id));
  console.log(`  Subjects with invalid/orphan assignedTeacherId: ${orphanSubjectsFiltered.length}`);
  if (orphanSubjectsFiltered.length > 0) {
    orphanSubjectsFiltered.slice(0, 10).forEach((s: any) => console.log(`    id=${s.id} name="${s.name}" class="${s.class_name}" teacher_id=${s.assigned_teacher_id}`));
  } else {
    console.log("  ✅ All subject teacher assignments are valid");
  }

  // ─── 5. Teacher userId linkage ───────────────────────────────────────────────
  console.log("\n🔗 TEACHERS - userId linkage");
  const teachersNoUser = teachers.filter(t => !t.userId);
  console.log(`  Teachers with NULL userId (no login account): ${teachersNoUser.length}`);
  if (teachersNoUser.length > 0) {
    teachersNoUser.forEach(t => console.log(`    id=${t.id} name="${t.name}"`));
  }

  // ─── 6. Timetable teacher references ───────────────────────────────────────
  console.log("\n📅 TIMETABLE - teacherId check");
  const timetableOrphan = await db.execute(sql`
    SELECT tt.id, tt.teacher_id
    FROM timetable tt
    WHERE tt.teacher_id IS NOT NULL
    AND tt.teacher_id NOT IN (SELECT id FROM teachers)
  `);
  console.log(`  Timetable entries with invalid teacherId: ${timetableOrphan.length}`);
  if (timetableOrphan.length === 0) console.log("  ✅ All timetable teacher references valid");

  // ─── 7. Summary ─────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(70));
  console.log("AUDIT COMPLETE");
  console.log("=".repeat(70));

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
