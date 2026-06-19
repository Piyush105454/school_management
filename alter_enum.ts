import { db } from './src/db';
import { sql } from 'drizzle-orm';
async function run() {
  try {
    await db.execute(sql`ALTER TYPE lesson_plan_status ADD VALUE IF NOT EXISTS 'COMPLETED'`);
    await db.execute(sql`ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS principal_remark TEXT`);
    console.log('Success');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
