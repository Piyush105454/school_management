import { db } from "../src/db";
import { incidents } from "../src/db/schema";

async function main() {
  console.log("Querying incidents from database...");
  try {
    const list = await db.select().from(incidents);
    console.log("Total records found:", list.length);
    console.log("Records:", JSON.stringify(list, null, 2));
  } catch (e: any) {
    console.error("Query failed:", e.message);
  }
}

main();
