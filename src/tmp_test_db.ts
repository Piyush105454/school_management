import { db } from "./db";
import { admissionMeta, homeVisits, inquiries, studentProfiles, entranceTests } from "./db/schema";
import { eq, desc } from "drizzle-orm";
import fs from "fs";

async function main() {
  try {
    const rows = await db
      .select({
        admissionMeta: admissionMeta,
        inquiry: inquiries,
        homeVisit: homeVisits,
        studentProfile: studentProfiles,
        entranceTest: entranceTests,
      })
      .from(admissionMeta)
      .leftJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .leftJoin(homeVisits, eq(admissionMeta.id, homeVisits.admissionId))
      .leftJoin(studentProfiles, eq(admissionMeta.id, studentProfiles.admissionMetaId))
      .leftJoin(entranceTests, eq(admissionMeta.id, entranceTests.admissionId))
      .orderBy(desc(admissionMeta.createdAt));

    fs.writeFileSync("error_log.txt", "Success: " + rows.length);
    process.exit(0);
  } catch (error: any) {
    const errorDetails = {
      message: error.message,
      cause: error.cause ? (error.cause.message || error.cause) : null,
      stack: error.stack,
    };
    fs.writeFileSync("error_log.txt", JSON.stringify(errorDetails, null, 2));
    process.exit(1);
  }
}

main();
