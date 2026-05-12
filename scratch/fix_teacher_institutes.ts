import { db } from "../src/db";
import { teachers } from "../src/db/schema";
import { isNull, eq } from "drizzle-orm";

async function fixTeacherInstitutes() {
  console.log("Fixing teacher institutes...");
  
  const result = await db.update(teachers)
    .set({ institute: "Dhanpuri Public School" })
    .where(isNull(teachers.institute));
    
  console.log("Updated teachers with null institute to Dhanpuri Public School.");
}

fixTeacherInstitutes().catch(console.error);
