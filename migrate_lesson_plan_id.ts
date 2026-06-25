import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Starting lesson plan ID migration...");

    // 1. Drop foreign key constraint
    console.log("Dropping foreign key constraint...");
    await db.execute(sql`
      ALTER TABLE homework_submissions 
      DROP CONSTRAINT IF EXISTS homework_submissions_lesson_plan_id_lesson_plans_id_fk
    `);

    // 2. Alter column types
    console.log("Altering column types to VARCHAR...");
    await db.execute(sql`
      ALTER TABLE lesson_plans 
      ALTER COLUMN id TYPE VARCHAR(255)
    `);
    
    await db.execute(sql`
      ALTER TABLE homework_submissions 
      ALTER COLUMN lesson_plan_id TYPE VARCHAR(255)
    `);

    // 3. Re-create foreign key constraint
    console.log("Re-creating foreign key constraint...");
    await db.execute(sql`
      ALTER TABLE homework_submissions 
      ADD CONSTRAINT homework_submissions_lesson_plan_id_lesson_plans_id_fk 
      FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE
    `);

    console.log("✅ Migration completed successfully!");
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message);
    if (err.stack) console.error(err.stack);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
