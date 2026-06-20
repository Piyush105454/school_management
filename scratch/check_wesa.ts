import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";

const db = drizzle(
  postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 }),
  { schema }
);

async function main() {
  const classes = await db.query.classes.findMany();
  console.log("ALL CLASSES IN DB:");
  console.log(JSON.stringify(classes, null, 2));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
