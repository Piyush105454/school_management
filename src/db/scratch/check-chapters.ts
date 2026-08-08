import { db } from "../../db";
import { classes, subjects, chapters } from "../../db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  // Find Class 4
  const class4 = await db.query.classes.findFirst({
    where: eq(classes.name, "Class 4"),
    with: {
      subjects: {
        where: eq(subjects.name, "Hindi"),
        with: {
          chapters: {
            with: {
              divisions: true
            }
          }
        }
      }
    }
  });

  console.log("Class 4 Hindi query result:");
  console.log(JSON.stringify(class4, null, 2));
  process.exit(0);
}

main().catch(console.error);
