import { db } from "./src/db";
import { subjects, teachers, classes } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const teacher = await db.query.teachers.findFirst({
    where: eq(teachers.name, "piyush tamoli")
  });
  console.log("Teacher:", teacher);
  
  if (teacher) {
    const assignedSubjects = await db.select().from(subjects).where(eq(subjects.assignedTeacherId, teacher.id));
    console.log("Assigned Subjects:", assignedSubjects);
    
    for (const sub of assignedSubjects) {
      if (sub.classId) {
        const cls = await db.query.classes.findFirst({ where: eq(classes.id, sub.classId) });
        console.log("Class for subject:", cls?.name);
      }
    }
  }
}
main().catch(console.error);
