import { db } from "./db";
import { students, classes } from "./db/schema";
import { isNull, eq } from "drizzle-orm";

async function fixStudents() {
  console.log("Checking for students with NULL classId...");
  
  const nullStudents = await db.select().from(students).where(isNull(students.classId));
  console.log(`Found ${nullStudents.length} students with NULL classId.`);

  if (nullStudents.length > 0) {
     // I don't know which class they belong to unless I have the original import data.
     // But wait, the attendance records might have had a className in the original logic?
     // No, the attendance table doesn't store the raw className.
     
     // However, I can check if there are classes named "LKG" or "UKG" that were created by mistake.
     const allClasses = await db.select().from(classes);
     console.log("Current classes:", JSON.stringify(allClasses, null, 2));
  }
}

fixStudents().catch(console.error);
