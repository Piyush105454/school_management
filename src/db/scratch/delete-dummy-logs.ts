import { db } from "../index";
import { activityLogs } from "../schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Deleting 4th August logs...");
  const res = await db.delete(activityLogs)
    .where(sql`to_char(${activityLogs.createdAt}, 'YYYY-MM-DD') = '2026-08-04'`);
  console.log("Delete completed!", res);
  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
