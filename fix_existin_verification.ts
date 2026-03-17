import { db } from "./src/db";
import { studentProfiles, documentChecklists } from "./src/db/schema";
import { eq, and } from "drizzle-orm";

import * as fs from "fs";

async function fixStatuses() {
  const logFile = "c:/Users/piyus/.gemini/antigravity/scratch/school_platform_project/fix_log.txt";
  fs.writeFileSync(logFile, "Starting status fix with Raw SQL...\n");

  try {
    const res = await db.execute(`
      UPDATE student_profiles 
      SET admission_step = 11 
      WHERE admission_meta_id IN (
        SELECT admission_id FROM document_checklists WHERE form_received_complete = true
      ) AND admission_step = 10;
    `);

    fs.appendFileSync(logFile, `Raw SQL update executed successfully.\n`);
  } catch (outerError: any) {
    fs.appendFileSync(logFile, `Outer Error: ${outerError.message}\n`);
  }
  process.exit(0);
}

fixStatuses().catch(console.error);
