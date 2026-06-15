import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./src/db/schema";
import { eq } from "drizzle-orm";

const db = drizzle(
  postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 }),
  { schema }
);

// Normalize a single class token:
//  "4"       → "Class 4"
//  "Class 4" → "Class 4"  (no change)
//  "KG1"     → "KG1"      (special names stay as-is)
//  "LKG"     → "LKG"
const SPECIAL = ["KG1", "KG2", "LKG", "UKG"];

function normalize(token: string): string {
  const t = token.trim();
  if (SPECIAL.includes(t.toUpperCase())) return t.toUpperCase() === t ? t : SPECIAL.find(s => s.toLowerCase() === t.toLowerCase())!;
  if (/^\d+$/.test(t)) return `Class ${t}`;            // bare number → "Class N"
  if (/^class\s+\d+$/i.test(t)) {                       // "class 4" → "Class 4"
    const num = t.replace(/^class\s+/i, "").trim();
    return `Class ${num}`;
  }
  return t; // leave other strings (e.g. "Class 1A") as-is
}

async function main() {
  console.log("=".repeat(60));
  console.log("FIXING classAssigned — normalize + deduplicate");
  console.log("=".repeat(60));

  const teachers = await db.query.teachers.findMany();
  let fixed = 0;

  for (const t of teachers) {
    if (!t.classAssigned) continue;

    const raw = t.classAssigned.split(",").map((x: string) => x.trim()).filter(Boolean);

    // Step 1: normalize each token
    const normalized = raw.map(normalize);

    // Step 2: deduplicate by lowercase key
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const n of normalized) {
      const key = n.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(n);
      }
    }

    const newValue = deduped.join(", ");

    if (newValue !== t.classAssigned) {
      console.log(`\n  Teacher: "${t.name}"`);
      console.log(`    BEFORE: "${t.classAssigned}"`);
      console.log(`    AFTER:  "${newValue}"`);
      await db
        .update(schema.teachers)
        .set({ classAssigned: newValue })
        .where(eq(schema.teachers.id, t.id));
      fixed++;
    }
  }

  console.log(`\n✅ Fixed ${fixed} teacher record(s). All others were already clean.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
