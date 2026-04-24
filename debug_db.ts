import { db } from "./src/db";
import { eq } from "drizzle-orm";
import { admissionMeta, studentBio, studentAddress, previousAcademic, parentGuardianDetails, studentBankDetails, studentDocuments, declarations, siblingDetails, documentChecklists, entranceTests, homeVisits } from "./src/db/schema";

async function debug() {
  const admissionId = "d0e0a0e0-60d4-4036-80da-f1bf9af9125b";
  
  console.log("Starting debug queries...");
  
  const queries = [
    { name: "studentBio", q: db.query.studentBio.findFirst({ where: eq(studentBio.admissionId, admissionId) }) },
    { name: "studentAddress", q: db.query.studentAddress.findFirst({ where: eq(studentAddress.admissionId, admissionId) }) },
    { name: "previousAcademic", q: db.query.previousAcademic.findFirst({ where: eq(previousAcademic.admissionId, admissionId) }) },
    { name: "parentGuardianDetails", q: db.query.parentGuardianDetails.findMany({ where: eq(parentGuardianDetails.admissionId, admissionId) }) },
    { name: "studentBankDetails", q: db.query.studentBankDetails.findFirst({ where: eq(studentBankDetails.admissionId, admissionId) }) },
    { name: "studentDocuments", q: db.query.studentDocuments.findFirst({ where: eq(studentDocuments.admissionId, admissionId) }) },
    { name: "declarations", q: db.query.declarations.findFirst({ where: eq(declarations.admissionId, admissionId) }) },
    { name: "siblingDetails", q: db.query.siblingDetails.findMany({ where: eq(siblingDetails.admissionId, admissionId) }) },
    { name: "documentChecklists", q: db.query.documentChecklists.findFirst({ where: eq(documentChecklists.admissionId, admissionId) }) },
    { name: "entranceTests", q: db.query.entranceTests.findFirst({ where: eq(entranceTests.admissionId, admissionId) }) },
    { name: "homeVisits", q: db.query.homeVisits.findFirst({ where: eq(homeVisits.admissionId, admissionId) }) },
  ];

  for (const item of queries) {
    try {
      console.log(`Checking ${item.name}...`);
      await item.q;
      console.log(`✅ ${item.name} OK`);
    } catch (e: any) {
      console.error(`❌ ${item.name} FAILED:`, e.message);
      if (e.stack) console.error(e.stack);
    }
  }
}

debug().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
