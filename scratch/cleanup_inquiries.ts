import { db } from "../src/db";
import { inquiries, classes } from "../src/db/schema";
import { and, inArray, eq } from "drizzle-orm";

async function run() {
  console.log("Cleaning up database...");

  // Delete inquiries for DPS 8-12
  const deletedDpsInquiries = await db.delete(inquiries).where(
    and(
      eq(inquiries.school, "Dhanpuri Public School"),
      inArray(inquiries.appliedClass, ["8", "9", "10", "11", "12", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"])
    )
  ).returning();
  
  console.log(`Deleted ${deletedDpsInquiries.length} DPS inquiries`);

  // Delete inquiries for WES Senior 1-4
  const deletedWesInquiries = await db.delete(inquiries).where(
    and(
      eq(inquiries.school, "WES Academy"),
      inArray(inquiries.appliedClass, ["Senior 1st Year", "Senior 2nd Year", "Senior 3rd Year", "Senior 4th Year"])
    )
  ).returning();
  
  console.log(`Deleted ${deletedWesInquiries.length} WES inquiries`);

  // Optionally remove obsolete classes from classes table
  const deletedClasses = await db.delete(classes).where(
    inArray(classes.name, ["Class 11", "Class 12", "Senior 1st Year", "Senior 2nd Year", "Senior 3rd Year", "Senior 4th Year"])
  ).returning();
  console.log(`Deleted ${deletedClasses.length} global classes`);
}

run().catch(console.error).finally(() => process.exit(0));
