import { db } from "../src/db";
import { classes, inquiries, teachers, studentProfiles, admissionMeta } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const clsList = await db.select().from(classes);
  console.log("=== CLASSES TABLE ===");
  console.log(clsList.map(c => ({ id: c.id, name: c.name, grade: c.grade })));

  const teacherList = await db.select().from(teachers);
  console.log("\n=== TEACHERS TABLE ===");
  console.log(teacherList.map(t => ({ id: t.id, name: t.name, classAssigned: t.classAssigned })));

  const inquiryClasses = await db.select({ appliedClass: inquiries.appliedClass }).from(inquiries).groupBy(inquiries.appliedClass);
  console.log("\n=== INQUIRIES DISTINCT APPLIED CLASSES ===");
  console.log(inquiryClasses);

  const fullyAdmittedStudents = await db
    .select({
      studentName: inquiries.studentName,
      appliedClass: inquiries.appliedClass,
      isFullyAdmitted: studentProfiles.isFullyAdmitted
    })
    .from(studentProfiles)
    .innerJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
    .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
    .where(eq(studentProfiles.isFullyAdmitted, true));

  console.log("\n=== FULLY ADMITTED STUDENTS ===");
  console.log(fullyAdmittedStudents);
}

main().catch(console.error);
