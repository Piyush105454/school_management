/**
 * Script to update all June PTM attendance records to ₹750
 * 
 * This script:
 * 1. Updates scholarship_records table for all June entries where PTM was attended
 * 2. Sets ptm_amount to 750
 * 3. Recalculates total_amount
 * 4. Shows a summary of affected records
 * 
 * Usage: 
 *   npx tsx update_june_ptm_750.ts
 *   or
 *   ts-node update_june_ptm_750.ts
 */

import { db } from "./src/db";
import { scholarshipRecords, scholarshipPtm, admissionMeta, studentBio } from "./src/db/schema";
import { eq, and, sql } from "drizzle-orm";

async function updateJunePtmTo750() {
  console.log("🔄 Starting June PTM Amount Update to ₹750...\n");

  try {
    // Step 1: Get all June scholarship records where PTM was attended
    const juneRecords = await db
      .select({
        recordId: scholarshipRecords.id,
        admissionId: scholarshipRecords.admissionId,
        month: scholarshipRecords.month,
        year: scholarshipRecords.year,
        currentPtmAmount: scholarshipRecords.ptmAmount,
        attendanceAmount: scholarshipRecords.attendanceAmount,
        homeworkAmount: scholarshipRecords.homeworkAmount,
        guardianAmount: scholarshipRecords.guardianAmount,
        adjustmentAmount: scholarshipRecords.adjustmentAmount,
        discountAmount: scholarshipRecords.discountAmount,
        additionalChargeAmount: scholarshipRecords.additionalChargeAmount,
        scholarNumber: admissionMeta.scholarNumber,
        firstName: studentBio.firstName,
        lastName: studentBio.lastName,
        ptmAttended: scholarshipPtm.attended,
      })
      .from(scholarshipRecords)
      .innerJoin(admissionMeta, eq(scholarshipRecords.admissionId, admissionMeta.id))
      .innerJoin(studentBio, eq(admissionMeta.id, studentBio.admissionId))
      .innerJoin(
        scholarshipPtm,
        and(
          eq(scholarshipRecords.admissionId, scholarshipPtm.admissionId),
          eq(scholarshipRecords.month, scholarshipPtm.month),
          eq(scholarshipRecords.year, scholarshipPtm.year)
        )
      )
      .where(
        and(
          eq(scholarshipRecords.month, "June"),
          eq(scholarshipPtm.attended, true)
        )
      );

    console.log(`📊 Found ${juneRecords.length} June records with PTM attended\n`);

    if (juneRecords.length === 0) {
      console.log("✅ No records to update. Exiting.");
      return;
    }

    // Display records that will be updated
    console.log("📋 Records to be updated:");
    console.log("─".repeat(100));
    console.log(
      "Scholar No.".padEnd(15),
      "Student Name".padEnd(25),
      "Month".padEnd(10),
      "Year".padEnd(8),
      "Current PTM".padEnd(15),
      "New PTM"
    );
    console.log("─".repeat(100));

    juneRecords.forEach((record) => {
      console.log(
        (record.scholarNumber || "N/A").padEnd(15),
        `${record.firstName} ${record.lastName}`.padEnd(25),
        record.month.padEnd(10),
        record.year.padEnd(8),
        `₹${record.currentPtmAmount}`.padEnd(15),
        `₹750`
      );
    });

    console.log("─".repeat(100));
    console.log();

    // Step 2: Update records one by one
    let updatedCount = 0;
    let errorCount = 0;

    for (const record of juneRecords) {
      try {
        // Calculate new total amount
        const newTotalAmount =
          record.attendanceAmount +
          record.homeworkAmount +
          record.guardianAmount +
          750 + // New PTM amount
          record.adjustmentAmount -
          record.discountAmount +
          record.additionalChargeAmount;

        // Update the record
        await db
          .update(scholarshipRecords)
          .set({
            ptmAmount: 750,
            totalAmount: newTotalAmount,
            updatedAt: new Date(),
          })
          .where(eq(scholarshipRecords.id, record.recordId));

        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating record for ${record.scholarNumber}:`, error);
        errorCount++;
      }
    }

    console.log("\n✅ Update Complete!");
    console.log(`   Successfully updated: ${updatedCount} records`);
    if (errorCount > 0) {
      console.log(`   ⚠️  Errors encountered: ${errorCount} records`);
    }

    // Step 3: Verify the update by fetching updated records
    console.log("\n🔍 Verification - Updated Records:");
    console.log("─".repeat(120));
    console.log(
      "Scholar No.".padEnd(15),
      "Student Name".padEnd(25),
      "PTM".padEnd(8),
      "Attendance".padEnd(12),
      "Homework".padEnd(10),
      "Guardian".padEnd(10),
      "Total".padEnd(10),
      "Status"
    );
    console.log("─".repeat(120));

    const verificationRecords = await db
      .select({
        scholarNumber: admissionMeta.scholarNumber,
        firstName: studentBio.firstName,
        lastName: studentBio.lastName,
        ptmAmount: scholarshipRecords.ptmAmount,
        attendanceAmount: scholarshipRecords.attendanceAmount,
        homeworkAmount: scholarshipRecords.homeworkAmount,
        guardianAmount: scholarshipRecords.guardianAmount,
        totalAmount: scholarshipRecords.totalAmount,
        status: scholarshipRecords.status,
      })
      .from(scholarshipRecords)
      .innerJoin(admissionMeta, eq(scholarshipRecords.admissionId, admissionMeta.id))
      .innerJoin(studentBio, eq(admissionMeta.id, studentBio.admissionId))
      .where(eq(scholarshipRecords.month, "June"))
      .orderBy(admissionMeta.scholarNumber);

    verificationRecords.forEach((record) => {
      console.log(
        (record.scholarNumber || "N/A").padEnd(15),
        `${record.firstName} ${record.lastName}`.padEnd(25),
        `₹${record.ptmAmount}`.padEnd(8),
        `₹${record.attendanceAmount}`.padEnd(12),
        `₹${record.homeworkAmount}`.padEnd(10),
        `₹${record.guardianAmount}`.padEnd(10),
        `₹${record.totalAmount}`.padEnd(10),
        record.status
      );
    });

    console.log("─".repeat(120));
    console.log("\n✨ All done!");
  } catch (error) {
    console.error("\n❌ Fatal Error:", error);
    process.exit(1);
  }
}

// Run the update
updateJunePtmTo750()
  .then(() => {
    console.log("\n👋 Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Unexpected error:", error);
    process.exit(1);
  });
