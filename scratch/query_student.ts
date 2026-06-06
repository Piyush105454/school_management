import "dotenv/config";
import { db } from "../src/db";
import { eq, isNotNull, not } from "drizzle-orm";
import { admissionMeta, inquiries, studentProfiles, students, studentBio } from "../src/db/schema";

async function queryData() {
  console.log("=== ADMISSION METAS WITH SCHOLAR NUMBER ===");
  const metas = await db.select({
    id: admissionMeta.id,
    entryNumber: admissionMeta.entryNumber,
    admissionNumber: admissionMeta.admissionNumber,
    scholarNumber: admissionMeta.scholarNumber,
    studentName: inquiries.studentName,
    appliedClass: inquiries.appliedClass,
  })
  .from(admissionMeta)
  .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
  .where(isNotNull(admissionMeta.scholarNumber));

  for (const m of metas) {
    console.log(`Name: ${m.studentName} | Class: ${m.appliedClass} | EntryNumber: ${m.entryNumber} | ScholarNumber: ${m.scholarNumber} | AdmissionNumber: ${m.admissionNumber}`);
  }

  console.log("\n=== STUDENTS WITH SCHOLAR NUMBER ===");
  const studs = await db.select()
    .from(students)
    .where(isNotNull(students.scholarNumber));
  for (const s of studs) {
    console.log(`ID: ${s.id} | studentId: ${s.studentId} | name: ${s.name} | scholarNumber: ${s.scholarNumber}`);
  }
  
  console.log("\n=== TOTAL STUDENTS COUNT ===");
  const allStuds = await db.select().from(students);
  console.log("Total students in students table:", allStuds.length);
  
  const allMetas = await db.select().from(admissionMeta);
  console.log("Total in admissionMeta table:", allMetas.length);

  const allInquiries = await db.select().from(inquiries);
  console.log("Total in inquiries table:", allInquiries.length);
}

queryData().catch(console.error).finally(() => process.exit(0));
