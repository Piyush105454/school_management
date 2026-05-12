import { db } from "../src/db";
import { classes } from "../src/db/schema";

async function listClasses() {
  const allClasses = await db.select().from(classes);
  console.log(JSON.stringify(allClasses, null, 2));
}

listClasses().catch(console.error);
