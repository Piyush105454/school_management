import { db } from "./src/db";
import { classes, inquiries } from "./src/db/schema";
import { eq, sql } from "drizzle-orm";

async function fixClassNames() {
  console.log("🔧 Starting class name standardization...\n");

  try {
    // Get all unique classes from the database
    const allClasses = await db.select().from(classes).orderBy(classes.id);
    
    console.log(`📊 Found ${allClasses.length} classes in database:\n`);
    allClasses.forEach(c => {
      console.log(`  ID: ${c.id.toString().padEnd(3)} | Name: "${c.name}" | Grade: ${c.grade} | Institute: ${c.institute || 'NULL'}`);
    });

    console.log("\n🔄 Standardizing class names...\n");

    let updateCount = 0;

    for (const cls of allClasses) {
      let standardizedName = cls.name;

      // Special handling for KG classes
      if (/^(kg\s*i|lkg)$/i.test(cls.name)) {
        standardizedName = "KG1";
      } else if (/^(kg\s*ii|ukg)$/i.test(cls.name)) {
        standardizedName = "KG2";
      } else if (/^nursery$/i.test(cls.name)) {
        standardizedName = "Nursery";
      } else {
        // For numbered classes, ensure they have "Class " prefix
        const numMatch = cls.name.match(/^(\d+)$/);
        if (numMatch) {
          // Just a number - add "Class " prefix
          standardizedName = `Class ${numMatch[1]}`;
        } else if (!/^class\s+\d+$/i.test(cls.name)) {
          // Not a standard format - try to extract number
          const anyNum = cls.name.match(/\d+/);
          if (anyNum) {
            standardizedName = `Class ${anyNum[0]}`;
          }
        } else {
          // Already in "Class X" format - just ensure proper casing
          standardizedName = cls.name.replace(/^class\s+/i, 'Class ');
        }
      }

      if (standardizedName !== cls.name) {
        console.log(`  Updating: "${cls.name}" → "${standardizedName}"`);
        
        await db.update(classes)
          .set({ name: standardizedName })
          .where(eq(classes.id, cls.id));

        updateCount++;
      }
    }

    console.log(`\n✅ Updated ${updateCount} class names\n`);

    // Also standardize inquiries.appliedClass to match database class names
    console.log("🔄 Standardizing inquiry applied classes...\n");

    const allInquiries = await db.select().from(inquiries);
    let inquiryUpdateCount = 0;

    for (const inq of allInquiries) {
      let standardizedApplied = inq.appliedClass;

      if (/^(kg\s*i|lkg)$/i.test(inq.appliedClass)) {
        standardizedApplied = "KG1";
      } else if (/^(kg\s*ii|ukg)$/i.test(inq.appliedClass)) {
        standardizedApplied = "KG2";
      } else if (/^nursery$/i.test(inq.appliedClass)) {
        standardizedApplied = "Nursery";
      } else {
        const numMatch = inq.appliedClass.match(/^(\d+)$/);
        if (numMatch) {
          standardizedApplied = `Class ${numMatch[1]}`;
        } else if (!/^class\s+\d+$/i.test(inq.appliedClass)) {
          const anyNum = inq.appliedClass.match(/\d+/);
          if (anyNum) {
            standardizedApplied = `Class ${anyNum[0]}`;
          }
        }
      }

      if (standardizedApplied !== inq.appliedClass) {
        console.log(`  Inquiry ${inq.id}: "${inq.appliedClass}" → "${standardizedApplied}"`);
        
        await db.update(inquiries)
          .set({ appliedClass: standardizedApplied })
          .where(eq(inquiries.id, inq.id));

        inquiryUpdateCount++;
      }
    }

    console.log(`\n✅ Updated ${inquiryUpdateCount} inquiries\n`);

    // Show final state
    console.log("📊 Final class names in database:\n");
    const finalClasses = await db.select().from(classes).orderBy(classes.id);
    finalClasses.forEach(c => {
      console.log(`  ID: ${c.id.toString().padEnd(3)} | Name: "${c.name}" | Grade: ${c.grade} | Institute: ${c.institute || 'NULL'}`);
    });

    console.log("\n✅ Class name standardization complete!\n");

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

fixClassNames().catch(console.error).finally(() => process.exit(0));
