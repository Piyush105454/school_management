import { db } from "../src/db";
import { classes, students, subjects, studentAttendance, lessonPlans, teachers, inquiries } from "../src/db/schema";
import { eq, sql, and } from "drizzle-orm";

async function migrateClasses() {
  console.log("Starting migration: LKG -> KG1, UKG -> KG2...");

  const allClasses = await db.select().from(classes);
  
  const dhanpuriLKG = allClasses.find(c => c.name === "LKG" && c.institute === "Dhanpuri Public School");
  const dhanpuriUKG = allClasses.find(c => c.name === "UKG" && c.institute === "Dhanpuri Public School");
  const dhanpuriKG1 = allClasses.find(c => c.name === "KG1" && c.institute === "Dhanpuri Public School");
  const dhanpuriKG2 = allClasses.find(c => c.name === "KG2" && c.institute === "Dhanpuri Public School");

  if (!dhanpuriKG1 || !dhanpuriKG2) {
    console.error("KG1 or KG2 not found for Dhanpuri Public School. Please run fix_classes.ts first.");
    return;
  }

  const migrationPairs = [];
  if (dhanpuriLKG) migrationPairs.push({ from: dhanpuriLKG, to: dhanpuriKG1 });
  if (dhanpuriUKG) migrationPairs.push({ from: dhanpuriUKG, to: dhanpuriKG2 });

  for (const pair of migrationPairs) {
    const fromId = pair.from.id;
    const toId = pair.to.id;
    const fromName = pair.from.name;
    const toName = pair.to.name;

    console.log(`Merging ${fromName} (ID: ${fromId}) into ${toName} (ID: ${toId})...`);

    // 1. Update students
    console.log("Updating students...");
    await db.update(students).set({ classId: toId }).where(eq(students.classId, fromId));

    // 2. Update subjects
    console.log("Updating subjects...");
    await db.update(subjects).set({ classId: toId }).where(eq(subjects.classId, fromId));

    // 3. Update attendance
    console.log("Updating attendance...");
    await db.update(studentAttendance).set({ classId: toId }).where(eq(studentAttendance.classId, fromId));

    // 4. Update lesson plans
    console.log("Updating lesson plans...");
    await db.update(lessonPlans).set({ classId: toId }).where(eq(lessonPlans.classId, fromId));

    // 5. Update inquiries (text-based)
    console.log(`Updating inquiries: ${fromName} -> ${toName}...`);
    await db.update(inquiries)
      .set({ appliedClass: toName })
      .where(and(eq(inquiries.appliedClass, fromName), eq(inquiries.school, "Dhanpuri Public School")));

    // 6. Update teachers (text-based, comma separated)
    console.log(`Updating teachers classAssigned: ${fromName} -> ${toName}...`);
    const allTeachers = await db.select().from(teachers);
    for (const t of allTeachers) {
      if (t.classAssigned && t.classAssigned.includes(fromName)) {
        const newAssigned = t.classAssigned.split(",").map(c => {
          const trimmed = c.trim();
          return trimmed === fromName ? toName : trimmed;
        }).join(", ");
        
        await db.update(teachers).set({ classAssigned: newAssigned }).where(eq(teachers.id, t.id));
      }
    }

    // 7. Delete old class
    console.log(`Deleting old class: ${fromName}...`);
    await db.delete(classes).where(eq(classes.id, fromId));
  }

  console.log("Migration completed successfully.");
}

migrateClasses().catch(console.error);
