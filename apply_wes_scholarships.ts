import { db } from "./src/db";
import { admissionMeta, studentProfiles } from "./src/db/schema";
import { inArray } from "drizzle-orm";

async function main() {
  const ids = [
    "92b6c806-f1a0-4640-9929-7b31ae31d03b",
    "bdd3ea1f-3c21-4473-a117-1764ee8f1d0f",
    "8441de75-50d1-4e10-bccf-38d3e6556648",
    "b46a4f35-4707-47d3-8d9e-80628a34e6d4",
    "56bd0a60-35fb-4fe9-82d7-67018a373ceb",
    "48d1c376-9a9a-48d6-a123-25a7aaf4234a",
    "00e6d44b-e690-4994-b2c7-788659f2b6e8"
  ];

  console.log("Starting update for WES Academy draft applications...");

  const updateMetaRes = await db.update(admissionMeta)
    .set({
      appliedScholarship: true,
      awardedScholarship: true,
      scholarshipAmount: 18000,
      updatedAt: new Date()
    })
    .where(inArray(admissionMeta.id, ids));

  console.log("Updated admission_meta records.");

  const updateProfileRes = await db.update(studentProfiles)
    .set({
      isFullyAdmitted: true,
      admissionStep: 13
    })
    .where(inArray(studentProfiles.admissionMetaId, ids));

  console.log("Updated student_profiles records.");
  console.log("Successfully updated all 7 students!");
}

main().catch(console.error);
