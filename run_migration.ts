import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    console.log('Adding columns reviewer_id_1 and reviewer_id_2 to subjects table...');
    await db.execute(sql`ALTER TABLE subjects ADD COLUMN IF NOT EXISTS reviewer_id_1 UUID REFERENCES teachers(id) ON DELETE SET NULL`);
    await db.execute(sql`ALTER TABLE subjects ADD COLUMN IF NOT EXISTS reviewer_id_2 UUID REFERENCES teachers(id) ON DELETE SET NULL`);
    console.log('Success!');
  } catch (e) {
    console.error('Migration failed:', e);
  }
  process.exit(0);
}

run();
