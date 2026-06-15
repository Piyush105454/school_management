import { db } from "./src/db";
import { lessonPlans } from "./src/db/schema";

async function main() {
  const plans = await db.query.lessonPlans.findMany({
    with: {
        teacher: true,
        class: true,
        subject: true
    }
  });
  console.log(JSON.stringify(plans, null, 2));
}

main().catch(console.error);
