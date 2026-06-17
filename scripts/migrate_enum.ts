import { sql } from 'drizzle-orm';
import { db } from '../src/db/index';

async function main() {
  await db.execute(sql.raw("ALTER TYPE lesson_plan_status ADD VALUE 'REVIEWED' AFTER 'SUBMITTED'"));
  console.log('Enum updated successfully');
  process.exit(0);
}
main().catch(console.error);
