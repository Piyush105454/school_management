import { db } from "../src/db";
import { teachers, subjects, classes } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const ts = await db.select().from(teachers);
  console.log("Teachers:", ts.map(t => ({ id: t.id, name: t.name, assignedRole: t.assignedRole, classAssigned: t.classAssigned, specialization: t.specialization })));
  
  const subs = await db.select().from(subjects);
  console.log("Subjects:", subs.map(s => ({ name: s.name, classId: s.classId, assignedTeacherId: s.assignedTeacherId })));
}

main().catch(console.error);
