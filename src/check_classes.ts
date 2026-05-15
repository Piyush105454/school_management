import { db } from "./db";
import { classes } from "./db/schema";

async function checkClasses() {
  const dbClasses = await db.select().from(classes);
  console.log("Classes in database:", JSON.stringify(dbClasses, null, 2));
}

checkClasses().catch(console.error);
