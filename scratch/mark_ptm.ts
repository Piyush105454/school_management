import "dotenv/config";
import { db } from "../src/db";
import { scholarshipPtm } from "../src/db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  const month = "June";
  const year = "2026";

  try {
    console.log(`Fetching all admission records...`);
    const admissions = await db.query.admissionMeta.findMany({
      columns: { id: true }
    });
    console.log(`Found ${admissions.length} students. Fetching existing PTM records for ${month}...`);

    const existingRecords = await db.query.scholarshipPtm.findMany({
      where: and(
        eq(scholarshipPtm.month, month),
        eq(scholarshipPtm.year, year)
      ),
      columns: { id: true, admissionId: true }
    });

    const existingMap = new Map(existingRecords.map(r => [r.admissionId, r.id]));

    const toInsert = [];
    const toUpdate = [];

    for (const adm of admissions) {
      if (existingMap.has(adm.id)) {
        toUpdate.push(existingMap.get(adm.id));
      } else {
        toInsert.push({
          admissionId: adm.id,
          month,
          year,
          attended: true
        });
      }
    }

    console.log(`Need to insert ${toInsert.length} and update ${toUpdate.length}...`);

    // Bulk Insert
    if (toInsert.length > 0) {
      // Chunking insert to avoid parameter limits just in case
      const chunkSize = 100;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        await db.insert(scholarshipPtm).values(chunk);
      }
    }

    // Concurrent Update
    if (toUpdate.length > 0) {
      const updatePromises = toUpdate.map(id => 
        db.update(scholarshipPtm)
          .set({ attended: true })
          .where(eq(scholarshipPtm.id, id))
      );
      
      // Execute all updates in parallel
      await Promise.all(updatePromises);
    }

    console.log(`Done! Successfully processed ${admissions.length} records.`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

main();
