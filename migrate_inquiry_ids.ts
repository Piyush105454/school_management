import { db } from "./src/db";
import { inquiries, admissionMeta } from "./src/db/schema";
import { eq, asc } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function migrate() {
  console.log("Starting ID migration...");
  try {
    // 1. Get all inquiries sorted by creation date
    const allInquiries = await db.query.inquiries.findMany({
      orderBy: [asc(inquiries.createdAt)],
    });

    console.log(`Found ${allInquiries.length} inquiries.`);

    // 2. Group by academic year to maintain separate sequences
    const groupedByYear: Record<string, typeof allInquiries> = {};
    for (const inq of allInquiries) {
      const year = inq.academicYear || "2026-27";
      if (!groupedByYear[year]) groupedByYear[year] = [];
      groupedByYear[year].push(inq);
    }

    // 3. Update each inquiry with new sequential ID
    for (const year in groupedByYear) {
      console.log(`Processing year: ${year} (${groupedByYear[year].length} entries)`);
      
      for (let i = 0; i < groupedByYear[year].length; i++) {
        const inq = groupedByYear[year][i];
        const nextNumber = (i + 1).toString().padStart(3, '0');
        const newId = `E${year} ${nextNumber}`;

        console.log(`Updating ${inq.studentName}: ${inq.entryNumber} -> ${newId}`);

        await db.transaction(async (tx) => {
          // Update Inquiry
          await tx.update(inquiries)
            .set({ entryNumber: newId })
            .where(eq(inquiries.id, inq.id));

          // Update AdmissionMeta (if exists)
          await tx.update(admissionMeta)
            .set({ entryNumber: newId })
            .where(eq(admissionMeta.inquiryId, inq.id));
        });
      }
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrate();
