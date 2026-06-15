import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./src/db/schema";

const db = drizzle(
  postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 }),
  { schema }
);

async function main() {
  const teachers = await db.query.teachers.findMany();

  console.log("ALL TEACHER classAssigned RAW VALUES:");
  console.log("=".repeat(60));
  for (const t of teachers) {
    if (!t.classAssigned) continue;
    const parts = t.classAssigned.split(",").map((x: string) => x.trim()).filter(Boolean);
    const hasBareNumber = parts.some((p: string) => /^\d+$/.test(p));
    const prefix = hasBareNumber ? "WARN " : "  OK ";
    console.log(prefix + '"' + t.name + '" => [' + parts.join(" | ") + "]");
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
