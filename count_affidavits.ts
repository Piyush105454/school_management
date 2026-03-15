import { db } from "./src/db";
import { studentDocuments } from "./src/db/schema";
import { isNotNull } from "drizzle-orm";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function check() {
  try {
    const docs = await db.select().from(studentDocuments).where(isNotNull(studentDocuments.affidavit));
    console.log(`Found ${docs.length} documents with affidavit uploaded.`);
    if (docs.length > 0) {
      console.log("Sample ID:", docs[0].id, "Admission ID:", docs[0].admissionId);
      console.log("Affidavit Snippet:", docs[0].affidavit?.substring(0, 50) + "...");
    } else {
      console.log("No affidavits found in the database.");
    }
  } catch (e: any) {
    console.error("Error checking db:", e);
  }
}

check();
