
import { db } from "./src/db";
import { classes, teachers } from "./src/db/schema";

async function main() {
  const allClasses = await db.select({ institute: classes.institute }).from(classes);
  const allTeachers = await db.select({ institute: teachers.institute }).from(teachers);
  
  const institutes = new Set([
    ...allClasses.map(c => c.institute),
    ...allTeachers.map(t => t.institute)
  ]);
  
  console.log("Unique Institutes:", Array.from(institutes).filter(Boolean));
}

main().catch(console.error);
