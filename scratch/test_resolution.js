import { getLessonPlanById } from '../src/features/academy/actions/lessonPlanActions';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function main() {
  const res = await getLessonPlanById('LP-2627-DEMO-TEST-0003');
  console.log("Result:", JSON.stringify(res, null, 2));
}

main();
