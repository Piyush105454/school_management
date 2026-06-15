import { db } from "../src/db";
import { lessonPlans } from "../src/db/schema";

async function main() {
    const plans = await db.query.lessonPlans.findMany();
    console.log("Total Plans:", plans.length);
    console.log(plans.map(p => ({ id: p.id, status: p.status, type: p.type, date: p.date })));
    process.exit(0);
}
main();
