import { db } from "../src/db";
import { teachers } from "../src/db/schema";
import { count, sql } from "drizzle-orm";

async function countTeachers() {
  const result = await db.select({
    institute: teachers.institute,
    count: count()
  }).from(teachers).groupBy(teachers.institute);
  
  console.log(JSON.stringify(result, null, 2));
}

countTeachers().catch(console.error);
