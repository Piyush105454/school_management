import { db } from "../src/db";
import { classes } from "../src/db/schema";
import { eq, and } from "drizzle-orm";

const DHANPURI = "Dhanpuri Public School";
const WES = "WES Academy";

const dhanpuriClasses = [
  { name: "KG1", grade: -2 },
  { name: "KG2", grade: -1 },
  { name: "Class 1", grade: 1 },
  { name: "Class 2", grade: 2 },
  { name: "Class 3", grade: 3 },
  { name: "Class 4", grade: 4 },
  { name: "Class 5", grade: 5 },
  { name: "Class 6", grade: 6 },
  { name: "Class 7", grade: 7 },
];

const wesClasses = [
  { name: "Class 5", grade: 5 },
  { name: "Class 6", grade: 6 },
  { name: "Class 7", grade: 7 },
  { name: "Class 8", grade: 8 },
  { name: "Class 9", grade: 9 },
];

async function fixClasses() {
  console.log("Starting class fix script...");

  const allDbClasses = await db.select().from(classes);

  async function processList(list: { name: string; grade: number }[], institute: string) {
    for (const item of list) {
      // Find if this class exists (either as "X" or "Class X")
      const numOnly = item.name.replace("Class ", "");
      const searchNames = [item.name, numOnly, `Class ${item.name}`, `Class Class ${numOnly}`];
      
      const existing = allDbClasses.find(c => 
        c.institute === institute && searchNames.includes(c.name)
      );

      if (existing) {
        if (existing.name !== item.name || existing.grade !== item.grade) {
          console.log(`Updating ${existing.name} to ${item.name} for ${institute}`);
          await db.update(classes)
            .set({ name: item.name, grade: item.grade })
            .where(eq(classes.id, existing.id));
        }
      } else {
        console.log(`Creating ${item.name} for ${institute}`);
        await db.insert(classes).values({
          name: item.name,
          grade: item.grade,
          institute: institute
        });
      }
    }
  }

  await processList(dhanpuriClasses, DHANPURI);
  await processList(wesClasses, WES);

  // Cleanup: find classes that shouldn't be there for these institutes?
  // Maybe not yet, let's just fix what we have.
  
  // Fix double "Class Class" for any other institute too
  for (const c of allDbClasses) {
    if (c.name.startsWith("Class Class ")) {
      const fixedName = c.name.replace("Class Class ", "Class ");
      console.log(`Fixing double prefix: ${c.name} -> ${fixedName}`);
      await db.update(classes).set({ name: fixedName }).where(eq(classes.id, c.id));
    }
  }

  console.log("Class fix script completed.");
}

fixClasses().catch(console.error);
