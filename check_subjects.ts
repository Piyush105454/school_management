import { db } from "./src/db";
import { subjects, teachers } from "./src/db/schema";

async function main() {
  const allSubjects = await db.select().from(subjects);
  console.log("Subjects:");
  console.log(allSubjects.filter(s => s.assignedTeacherId !== null).slice(0, 5));
}
main().catch(console.error);
