import { db } from "../index";
import { scholarshipRecords, scholarshipHomework, students, admissionMeta } from "../schema";
import { eq, and } from "drizzle-orm";

async function main() {
  const allAdms = await db.query.admissionMeta.findMany();
  const adm = allAdms.find(a => a.id.toString().includes("b85b-49d5-8cb7-7b5bac03054a") || a.id.toString().includes("b4cdaf3"));
  
  if (adm) {
    console.log("Found admission:", adm.id);
    
    const records = await db.query.scholarshipRecords.findMany({
      where: and(
        eq(scholarshipRecords.admissionId, adm.id),
        eq(scholarshipRecords.month, "July")
      )
    });
    console.log("July Scholarship Records:", JSON.stringify(records, null, 2));
    
    const hw = await db.query.scholarshipHomework.findMany({
      where: and(
        eq(scholarshipHomework.admissionId, adm.id),
        eq(scholarshipHomework.month, "July")
      )
    });
    console.log("July Scholarship Homework:", JSON.stringify(hw, null, 2));
  } else {
    console.log("Admission not found. Available IDs:", allAdms.map(a => a.id).slice(0, 10));
  }
}

async function checkStudent(student: any) {
  const admissions = await db.query.admissionMeta.findMany({
    where: eq(admissionMeta.entryNumber, student.studentId)
  });
  
  console.log("Admissions found:", admissions.length);
  for (const adm of admissions) {
    console.log("Admission ID:", adm.id);
    
    const records = await db.query.scholarshipRecords.findMany({
      where: and(
        eq(scholarshipRecords.admissionId, adm.id),
        eq(scholarshipRecords.month, "July")
      )
    });
    console.log("July Scholarship Records:", JSON.stringify(records, null, 2));
    
    const hw = await db.query.scholarshipHomework.findMany({
      where: and(
        eq(scholarshipHomework.admissionId, adm.id),
        eq(scholarshipHomework.month, "July")
      )
    });
    console.log("July Scholarship Homework:", JSON.stringify(hw, null, 2));
  }
}

main().catch(console.error);
