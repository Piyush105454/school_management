import { db } from './src/db';
import { lessonPlans } from './src/db/schema';
import { eq, and } from 'drizzle-orm';

async function run() {
  try {
    const plans = await db.select().from(lessonPlans).where(
      and(
        eq(lessonPlans.classId, 41),
        eq(lessonPlans.subjectId, 886)
      )
    );
    console.log('MATCHING LESSON PLANS IN DB:');
    console.log(JSON.stringify(plans, null, 2));
  } catch (e) {
    console.error('Failed to query db:', e);
  }
  process.exit(0);
}

run();
