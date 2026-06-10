import { db } from "../src/db";
import { classes } from "../src/db/schema";
import { inArray } from "drizzle-orm";

async function run() {
  console.log("Deleting Class 8, 9, 10 for Dhanpuri Public School...");
  
  const deleted = await db.delete(classes)
    .where(inArray(classes.id, [33, 37, 38]))
    .returning();
    
  console.log(`Deleted ${deleted.length} classes:`, deleted);
}

run().catch(console.error).finally(() => process.exit(0));
