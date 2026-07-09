import { db } from './src/db';
import { classes } from './src/db/schema';

async function run() {
  try {
    const list = await db.select().from(classes).orderBy(classes.grade);
    console.log('ALL CLASSES IN DB:');
    console.log(JSON.stringify(list, null, 2));
  } catch (e) {
    console.error('Failed to query db:', e);
  }
  process.exit(0);
}

run();

