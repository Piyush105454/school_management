import { db } from "./db";
import { teachers } from "./db/schema";

async function listTeachers() {
  const allTeachers = await db.select({ name: teachers.name }).from(teachers);
  console.log("Teachers in DB:");
  allTeachers.forEach(t => console.log(`- "${t.name}"`));
}

listTeachers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
