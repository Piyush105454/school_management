import { db } from '@/db';
import { subjects } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  try {
    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.id, 829),
      with: {
        reviewer1: true,
        reviewer2: true
      }
    });

    console.log('--- SUBJECT ---');
    console.log(subject);

  } catch (e) {
    console.error('Failed to query db:', e);
  }
  process.exit(0);
}

run();
