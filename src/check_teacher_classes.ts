import { db } from './db';
import { teachers, classes, users } from './db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const allTeachers = await db.select().from(teachers);
  console.log("TEACHERS:");
  console.log(allTeachers.map(t => ({
    id: t.id,
    userId: t.userId,
    classAssigned: t.classAssigned,
    institute: t.institute
  })));

  const allDbClasses = await db.select().from(classes);
  console.log("CLASSES:");
  console.log(allDbClasses.map(c => ({
    id: c.id,
    name: c.name,
    institute: c.institute
  })));

  process.exit(0);
}
run();
