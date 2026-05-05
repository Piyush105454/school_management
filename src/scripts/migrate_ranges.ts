import { db } from "../db";
import { classes } from "../db/schema";
import { eq, and } from "drizzle-orm";

const DPS = "Dhanpuri Public School";
const WES = "WES Academy";

const dpsClasses = ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const wesClasses = ["5", "6", "7", "8", "9", "10", "Senior 1st Year", "Senior 2nd Year", "Senior 3rd Year", "Senior 4th Year"];

async function migrate() {
  console.log("Starting migration...");

  // 1. Assign existing classes to institutes based on current InquiryForm logic
  // LKG-7 -> DPS
  // 8 -> WES (as per original logic)
  
  const existingClasses = await db.query.classes.findMany();
  
  for (const cls of existingClasses) {
    let targetInstitute = DPS;
    if (cls.name === "8" || cls.name === "Class 8") targetInstitute = WES;
    
    // Normalize name to "Class X" if it's a number
    let normalizedName = cls.name;
    if (!["LKG", "UKG"].includes(cls.name) && !cls.name.startsWith("Class ") && !cls.name.startsWith("Senior")) {
      normalizedName = `Class ${cls.name}`;
    }

    await db.update(classes)
      .set({ institute: targetInstitute, name: normalizedName })
      .where(eq(classes.id, cls.id));
    
    console.log(`Updated existing class: ${cls.name} -> ${normalizedName} (${targetInstitute})`);
  }

  // 2. Ensure all DPS classes exist
  for (const name of dpsClasses) {
    const normalized = ["LKG", "UKG"].includes(name) ? name : `Class ${name}`;
    const exists = await db.query.classes.findFirst({
      where: (c, { and, eq }) => and(eq(c.name, normalized), eq(c.institute, DPS))
    });

    if (!exists) {
      await db.insert(classes).values({
        name: normalized,
        institute: DPS,
        grade: parseInt(name) || 0
      });
      console.log(`Created DPS class: ${normalized}`);
    }
  }

  // 3. Ensure all WES classes exist
  for (const name of wesClasses) {
    const normalized = name.startsWith("Senior") ? name : `Class ${name}`;
    const exists = await db.query.classes.findFirst({
      where: (c, { and, eq }) => and(eq(c.name, normalized), eq(c.institute, WES))
    });

    if (!exists) {
      await db.insert(classes).values({
        name: normalized,
        institute: WES,
        grade: parseInt(name) || 0
      });
      console.log(`Created WES class: ${normalized}`);
    }
  }

  console.log("Migration completed successfully!");
}

migrate().catch(console.error);
