import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Starting migration to remove units table...");

  // 1. Add subject_id column to chapters (allowing null temporarily while we backfill)
  console.log("Adding subject_id column to chapters table...");
  await db.execute(sql`
    ALTER TABLE chapters 
    ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE;
  `);

  // 2. Backfill subject_id from units table
  console.log("Backfilling subject_id values from units...");
  await db.execute(sql`
    UPDATE chapters 
    SET subject_id = units.subject_id 
    FROM units 
    WHERE chapters.unit_id = units.id;
  `);

  // 3. Make subject_id NOT NULL now that it is backfilled
  console.log("Making subject_id column NOT NULL...");
  await db.execute(sql`
    ALTER TABLE chapters 
    ALTER COLUMN subject_id SET NOT NULL;
  `);

  // 4. Drop the foreign key constraint and unit_id column on chapters
  console.log("Dropping unit_id constraints and column on chapters...");
  await db.execute(sql`
    ALTER TABLE chapters DROP CONSTRAINT IF EXISTS chapters_unit_id_units_id_fk;
    ALTER TABLE chapters DROP CONSTRAINT IF EXISTS chapters_unit_id_fkey;
    ALTER TABLE chapters DROP COLUMN IF EXISTS unit_id;
  `);

  // 5. Drop the units table
  console.log("Dropping the units table...");
  await db.execute(sql`
    DROP TABLE IF EXISTS units CASCADE;
  `);

  console.log("Migration completed successfully!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
