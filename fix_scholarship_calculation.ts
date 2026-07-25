/**
 * Script to recalculate all scholarship records using correct hybrid logic
 * 
 * OLD (WRONG) LOGIC:
 * - Always proportional for all percentages
 * - Example: 90% homework = 90% × ₹750 / 100 = ₹675 ❌
 * 
 * NEW (CORRECT) HYBRID LOGIC:
 * - If percentage >= threshold: Full amount ✅
 *   Example: 90% homework >= 90% threshold = ₹750
 * - If percentage < threshold: Proportional amount ✅
 *   Example: 85% homework < 90% threshold = 85% × ₹750 / 100 = ₹637.50
 * 
 * Usage: npx tsx fix_scholarship_calculation.ts
 */

import { db } from "./src/db";
import {
  scholarshipRecords,
  scholarshipAttendance,
  scholarshipHomework,
  scholarshipGuardian,
  scholarshipPtm,
  scholarshipCriteriaSettings,
  admissionMeta,
  studentBio,
} from "./src/db/schema";
import { eq, and, isNull } from "drizzle-orm";

async function recalculateAllScholarships() {
  console.log("🔄 Starting Scholarship Recalculation with Hybrid Logic...\n");

  try {
    // Get all scholarship records
    const allRecords = await db
      .select({
        recordId: scholarshipRecords.id,
        admissionId: scholarshipRecords.admissionId,
        month: scholarshipRecords.month,
        year: scholarshipRecords.year,
        currentAttendanceAmount: scholarshipRecords.attendanceAmount,
        currentHomeworkAmount: scholarshipRecords.homeworkAmount,
        currentGuardianAmount: scholarshipRecords.guardianAmount,
        currentPtmAmount: scholarshipRecords.ptmAmount,
        currentTotalAmount: scholarshipRecords.totalAmount,
        adjustmentAmount: scholarshipRecords.adjustmentAmount,
        discountAmount: scholarshipRecords.discountAmount,
        additionalChargeAmount: scholarshipRecords.additionalChargeAmount,
        scholarNumber: admissionMeta.scholarNumber,
        firstName: studentBio.firstName,
        lastName: studentBio.lastName,
      })
      .from(scholarshipRecords)
      .innerJoin(admissionMeta, eq(scholarshipRecords.admissionId, admissionMeta.id))
      .innerJoin(studentBio, eq(admissionMeta.id, studentBio.admissionId));

    console.log(`📊 Found ${allRecords.length} total records\n`);

    // Get global criteria
    const criteria = await db.query.scholarshipCriteriaSettings.findFirst({
      where: and(
        eq(scholarshipCriteriaSettings.academicYear, "2025-26"),
        isNull(scholarshipCriteriaSettings.admissionId)
      ),
    });

    if (!criteria) {
      console.error("❌ No global criteria settings found!");
      return;
    }

    console.log("📋 Criteria Settings:");
    console.log(`   Attendance: >= ${criteria.attendanceThreshold}% = ₹${criteria.attendanceAmount}`);
    console.log(`   Homework: >= ${criteria.homeworkThreshold}% = ₹${criteria.homeworkAmount}`);
    console.log(`   Guardian: >= ${criteria.guardianRatingThreshold}/5 = ₹${criteria.guardianAmount}`);
    console.log(`   PTM: Attended = ₹${criteria.ptmAmount}\n`);

    let changedCount = 0;
    let unchangedCount = 0;

    console.log("─".repeat(150));
    console.log(
      "Scholar No.".padEnd(15),
      "Name".padEnd(20),
      "Month".padEnd(10),
      "Att%".padEnd(8),
      "Att₹".padEnd(10),
      "HW%".padEnd(8),
      "HW₹".padEnd(10),
      "Grd".padEnd(6),
      "Grd₹".padEnd(10),
      "PTM".padEnd(6),
      "PTM₹".padEnd(10),
      "Total".padEnd(10),
      "Status"
    );
    console.log("─".repeat(150));

    for (const record of allRecords) {
      // Get attendance data
      const attendance = await db.query.scholarshipAttendance.findFirst({
        where: and(
          eq(scholarshipAttendance.admissionId, record.admissionId),
          eq(scholarshipAttendance.month, record.month),
          eq(scholarshipAttendance.year, record.year)
        ),
      });

      // Get homework data
      const homework = await db.query.scholarshipHomework.findFirst({
        where: and(
          eq(scholarshipHomework.admissionId, record.admissionId),
          eq(scholarshipHomework.month, record.month),
          eq(scholarshipHomework.year, record.year)
        ),
      });

      // Get guardian data
      const guardian = await db.query.scholarshipGuardian.findFirst({
        where: and(
          eq(scholarshipGuardian.admissionId, record.admissionId),
          eq(scholarshipGuardian.month, record.month),
          eq(scholarshipGuardian.year, record.year)
        ),
      });

      // Get PTM data
      const ptm = await db.query.scholarshipPtm.findFirst({
        where: and(
          eq(scholarshipPtm.admissionId, record.admissionId),
          eq(scholarshipPtm.month, record.month),
          eq(scholarshipPtm.year, record.year)
        ),
      });

      // Calculate percentages
      const attendancePct = attendance
        ? attendance.totalDays > 0
          ? (attendance.presentDays / attendance.totalDays) * 100
          : 0
        : 0;

      const homeworkPct = homework
        ? homework.totalGiven > 0
          ? (homework.totalDone / homework.totalGiven) * 100
          : 0
        : 0;

      // Calculate new amounts using HYBRID logic
      // If >= threshold: Full amount, otherwise: Proportional
      const newAttendanceAmount =
        attendancePct >= criteria.attendanceThreshold 
          ? criteria.attendanceAmount 
          : Math.round((attendancePct / 100) * criteria.attendanceAmount);

      const newHomeworkAmount =
        homeworkPct >= criteria.homeworkThreshold 
          ? criteria.homeworkAmount 
          : Math.round((homeworkPct / 100) * criteria.homeworkAmount);

      const guardianRating = guardian?.rating || 0;
      const newGuardianAmount =
        guardianRating >= criteria.guardianRatingThreshold ? criteria.guardianAmount : 0;

      const newPtmAmount = ptm?.attended ? criteria.ptmAmount : 0;

      const newTotalAmount = newAttendanceAmount + newHomeworkAmount + newGuardianAmount + newPtmAmount;

      // Check if amounts changed
      const hasChanged =
        newAttendanceAmount !== record.currentAttendanceAmount ||
        newHomeworkAmount !== record.currentHomeworkAmount ||
        newGuardianAmount !== record.currentGuardianAmount ||
        newPtmAmount !== record.currentPtmAmount;

      const status = hasChanged ? "CHANGED" : "OK";

      if (hasChanged) {
        changedCount++;
      } else {
        unchangedCount++;
      }

      console.log(
        (record.scholarNumber || "N/A").padEnd(15),
        `${record.firstName} ${record.lastName}`.substring(0, 19).padEnd(20),
        record.month.padEnd(10),
        `${attendancePct.toFixed(1)}%`.padEnd(8),
        `₹${newAttendanceAmount}`.padEnd(10),
        `${homeworkPct.toFixed(1)}%`.padEnd(8),
        `₹${newHomeworkAmount}`.padEnd(10),
        `${guardianRating}/5`.padEnd(6),
        `₹${newGuardianAmount}`.padEnd(10),
        (ptm?.attended ? "Yes" : "No").padEnd(6),
        `₹${newPtmAmount}`.padEnd(10),
        `₹${newTotalAmount}`.padEnd(10),
        status
      );

      // Update the record if changed
      if (hasChanged) {
        await db
          .update(scholarshipRecords)
          .set({
            attendanceAmount: newAttendanceAmount,
            homeworkAmount: newHomeworkAmount,
            guardianAmount: newGuardianAmount,
            ptmAmount: newPtmAmount,
            totalAmount: newTotalAmount,
            updatedAt: new Date(),
          })
          .where(eq(scholarshipRecords.id, record.recordId));
      }
    }

    console.log("─".repeat(150));
    console.log(`\n✅ Recalculation Complete!`);
    console.log(`   Changed: ${changedCount} records`);
    console.log(`   Unchanged: ${unchangedCount} records`);
    console.log(`   Total: ${allRecords.length} records\n`);
  } catch (error) {
    console.error("\n❌ Fatal Error:", error);
    process.exit(1);
  }
}

// Run the recalculation
recalculateAllScholarships()
  .then(() => {
    console.log("👋 Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Unexpected error:", error);
    process.exit(1);
  });
