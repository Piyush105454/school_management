import "dotenv/config";
import { db } from "../src/db";
import { eq } from "drizzle-orm";
import { 
  admissionMeta, 
  inquiries, 
  studentProfiles, 
  students, 
  studentBio, 
  studentAddress, 
  previousAcademic, 
  parentGuardianDetails, 
  studentBankDetails, 
  studentDocuments, 
  declarations, 
  siblingDetails, 
  documentChecklists, 
  entranceTests, 
  homeVisits 
} from "../src/db/schema";

async function dumpAll() {
  const admissionId = "0b8eb4f9-cd04-488a-ac4b-d8e014e0d750"; // Arsh Dahayat
  console.log(`=== DUMPING ALL RECORDS FOR ADMISSION ID: ${admissionId} ===`);
  
  const tables = [
    { name: "admissionMeta", table: admissionMeta, query: db.select().from(admissionMeta).where(eq(admissionMeta.id, admissionId)) },
    { name: "studentProfiles", table: studentProfiles, query: db.select().from(studentProfiles).where(eq(studentProfiles.admissionMetaId, admissionId)) },
    { name: "studentBio", table: studentBio, query: db.select().from(studentBio).where(eq(studentBio.admissionId, admissionId)) },
    { name: "studentAddress", table: studentAddress, query: db.select().from(studentAddress).where(eq(studentAddress.admissionId, admissionId)) },
    { name: "previousAcademic", table: previousAcademic, query: db.select().from(previousAcademic).where(eq(previousAcademic.admissionId, admissionId)) },
    { name: "parentGuardianDetails", table: parentGuardianDetails, query: db.select().from(parentGuardianDetails).where(eq(parentGuardianDetails.admissionId, admissionId)) },
    { name: "studentBankDetails", table: studentBankDetails, query: db.select().from(studentBankDetails).where(eq(studentBankDetails.admissionId, admissionId)) },
    { name: "studentDocuments", table: studentDocuments, query: db.select().from(studentDocuments).where(eq(studentDocuments.admissionId, admissionId)) },
    { name: "declarations", table: declarations, query: db.select().from(declarations).where(eq(declarations.admissionId, admissionId)) },
    { name: "siblingDetails", table: siblingDetails, query: db.select().from(siblingDetails).where(eq(siblingDetails.admissionId, admissionId)) },
    { name: "documentChecklists", table: documentChecklists, query: db.select().from(documentChecklists).where(eq(documentChecklists.admissionId, admissionId)) },
    { name: "entranceTests", table: entranceTests, query: db.select().from(entranceTests).where(eq(entranceTests.admissionId, admissionId)) },
    { name: "homeVisits", table: homeVisits, query: db.select().from(homeVisits).where(eq(homeVisits.admissionId, admissionId)) }
  ];

  for (const t of tables) {
    try {
      const rows = await t.query;
      console.log(`\nTable: ${t.name} (${rows.length} rows)`);
      if (rows.length > 0) {
        console.log(JSON.stringify(rows, null, 2));
      }
    } catch (e: any) {
      console.error(`Error querying ${t.name}:`, e.message);
    }
  }

  // Query inquiries
  const meta = await db.query.admissionMeta.findFirst({
    where: eq(admissionMeta.id, admissionId)
  });
  if (meta?.inquiryId) {
    try {
      const inq = await db.select().from(inquiries).where(eq(inquiries.id, meta.inquiryId));
      console.log(`\nTable: inquiries (${inq.length} rows)`);
      console.log(JSON.stringify(inq, null, 2));
    } catch (e: any) {
      console.error("Error querying inquiries:", e.message);
    }
  }

  // Query students
  if (meta?.entryNumber) {
    try {
      const stud = await db.select().from(students).where(eq(students.studentId, meta.entryNumber));
      console.log(`\nTable: students (${stud.length} rows)`);
      console.log(JSON.stringify(stud, null, 2));
    } catch (e: any) {
      console.error("Error querying students:", e.message);
    }
  }
}

dumpAll().catch(console.error).finally(() => process.exit(0));
