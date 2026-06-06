import "dotenv/config";
import { db } from "../src/db";
import { eq, like, or } from "drizzle-orm";
import { admissionMeta, inquiries, studentProfiles, students } from "../src/db/schema";

async function queryKG1() {
  console.log("=== SEARCHING FOR PRASHANT CHAUDHARY ===");
  const inqs = await db.select()
    .from(inquiries)
    .where(or(
      like(inquiries.studentName, "%Prashant%"),
      like(inquiries.studentName, "%Diksha%"),
      like(inquiries.studentName, "%Arsh%")
    ));
    
  for (const i of inqs) {
    console.log(`Inquiry: ID=${i.id} | Name=${i.studentName} | Class=${i.appliedClass}`);
    
    // Find AdmissionMeta
    const meta = await db.query.admissionMeta.findFirst({
      where: eq(admissionMeta.inquiryId, i.id)
    });
    if (meta) {
      console.log(`  AdmissionMeta: ID=${meta.id} | entryNumber=${meta.entryNumber} | scholarNumber=${meta.scholarNumber} | admissionNumber=${meta.admissionNumber}`);
      
      // Find Student in students table
      const stud = await db.query.students.findFirst({
        where: eq(students.studentId, meta.entryNumber)
      });
      if (stud) {
        console.log(`    Student: ID=${stud.id} | studentId=${stud.studentId} | name=${stud.name} | scholarNumber=${stud.scholarNumber} | rollNumber=${stud.rollNumber}`);
      } else {
        console.log(`    Student: NOT FOUND in students table for studentId=${meta.entryNumber}`);
      }
    } else {
      console.log(`  AdmissionMeta: NOT FOUND for inquiryId=${i.id}`);
    }
  }
}

queryKG1().catch(console.error).finally(() => process.exit(0));
