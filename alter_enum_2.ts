import { db } from './src/db';
import { sql } from 'drizzle-orm';
async function run() {
  try {
    await db.execute(sql`ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS chapter_division_id INTEGER`);
    console.log('Success');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
