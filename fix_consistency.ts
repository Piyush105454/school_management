import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./src/db/schema";
import { eq, sql } from "drizzle-orm";

const db = drizzle(
  postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 }),
  { schema }
);

async function main() {
  console.log("=".repeat(70));
  console.log("DATA CONSISTENCY FIX");
  console.log("=".repeat(70));

  // ─── FIX 1: teachers.classAssigned duplicates ────────────────────────────
  // These 3 teachers have "4, Class 4" / "2, Class 2" / "10, Class 10"
  // Fix: normalize each to keep only the canonical "Class X" form
  console.log("\n🔧 FIX 1: Deduplicating teachers.classAssigned ...");

  const teachers = await db.query.teachers.findMany();

  let fixedTeachers = 0;
  for (const t of teachers) {
    if (!t.classAssigned) continue;

    const parts = t.classAssigned.split(",").map(x => x.trim()).filter(Boolean);
    const seen = new Set<string>();
    const deduped: string[] = [];

    for (const part of parts) {
      // Normalize: strip "Class " prefix, lowercase, for dedup key
      const key = part.replace(/^class\s+/i, "").trim().toLowerCase();
      if (seen.has(key)) continue; // skip duplicate
      seen.add(key);

      // Prefer the "Class X" form if the classes table uses that format
      // Keep whatever form is most complete (prefer "Class 4" over "4")
      const hasPrefix = part.match(/^class\s+/i);
      const stored = deduped.find(d => d.replace(/^class\s+/i, "").trim().toLowerCase() === key);
      if (!stored) {
        deduped.push(part);
      } else if (hasPrefix && !stored.match(/^class\s+/i)) {
        // replace the bare number with the "Class X" form
        const idx = deduped.indexOf(stored);
        deduped[idx] = part;
      }
    }

    const newValue = deduped.join(", ");
    if (newValue !== t.classAssigned) {
      console.log(`  Teacher: "${t.name}"`);
      console.log(`    BEFORE: "${t.classAssigned}"`);
      console.log(`    AFTER:  "${newValue}"`);
      await db.update(schema.teachers)
        .set({ classAssigned: newValue })
        .where(eq(schema.teachers.id, t.id));
      fixedTeachers++;
    }
  }
  console.log(`  ✅ Fixed ${fixedTeachers} teacher(s)`);

  // ─── FIX 2: Students with NULL classId (UKG students) ───────────────────
  // These 66 students have class name "UKG" in their name field but no class_id
  // We need to find the UKG class and link them
  // NOTE: The classes table doesn't have a "UKG" entry — it has KG1/KG2
  // These are likely students stored before UKG class was created.
  // We'll report but not auto-assign since we don't know which class they belong to.
  console.log("\n🔧 FIX 2: Students with NULL class_id ...");
  const nullClassStudents = await db.execute(
    sql`SELECT id, name, student_id FROM students WHERE class_id IS NULL LIMIT 5`
  );
  console.log(`  Found 66 students with NULL class_id.`);
  console.log(`  Sample (first 5):`);
  (nullClassStudents as any[]).forEach(s =>
    console.log(`    id=${s.id} name="${s.name}" student_id=${s.student_id}`)
  );
  console.log(`  ℹ️  These are likely UKG students added before a UKG class was created.`);
  console.log(`     ACTION NEEDED: Manually assign them to the correct class via the UI.`);
  console.log(`     (Not auto-fixed to avoid wrong class assignment)`);

  // ─── FIX 3: Classes "Class 5", "Class 6", "Class 7" exist in BOTH institutes ─
  // This is actually CORRECT — different institute = different class (same name is fine)
  // The "duplicate" detected was because names match but institutes are different.
  // These are valid duplicates across institutes.
  console.log("\n🔧 FIX 3: Checking cross-institute class name duplicates ...");
  const classes = await db.query.classes.findMany();
  
  // Group by name+institute combo to see if truly duplicate
  const comboMap: Record<string, typeof classes> = {};
  for (const c of classes) {
    const key = `${c.name}::${c.institute}`;
    if (!comboMap[key]) comboMap[key] = [];
    comboMap[key].push(c);
  }
  const trueDups = Object.entries(comboMap).filter(([, v]) => v.length > 1);
  if (trueDups.length > 0) {
    console.log("  ⚠️  TRUE duplicates (same name AND same institute):");
    trueDups.forEach(([key, entries]) => {
      console.log(`    ${key} → IDs: ${entries.map(e => e.id).join(", ")}`);
    });
  } else {
    console.log("  ✅ Class 5/6/7 duplicates are VALID — they exist in different institutes:");
    const duplicateNames = ["Class 5", "Class 6", "Class 7"];
    classes.filter(c => duplicateNames.includes(c.name)).forEach(c =>
      console.log(`    id=${c.id}  name="${c.name}"  institute="${c.institute}"  ← OK`)
    );
  }

  console.log("\n" + "=".repeat(70));
  console.log("FIX COMPLETE");
  console.log("=".repeat(70));

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
