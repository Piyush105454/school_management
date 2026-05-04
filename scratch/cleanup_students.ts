import { db } from "./src/db";
import { students } from "./src/db/schema";
import { like, or } from "drizzle-orm";

async function clean() {
  console.log("Cleaning up junk students...");
  const result = await db.delete(students).where(
    or(
      like(students.name, "CLASS %"),
      like(students.name, "Class %"),
      like(students.name, "undefined")
    )
  );
  console.log("Cleanup complete!");
  process.exit(0);
}

clean().catch(err => {
  console.error(err);
  process.exit(1);
});
