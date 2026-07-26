import { db } from "./src/db";
import {
  studentAttendance,
  scholarshipAttendance,
  students,
  admissionMeta,
} from "./src/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Script to apply the attendance synchronization fix
 * Links admissionMeta → students (via entryNumber) → studentAttendance
 * Then recalculates scholarship_attendance percentages based on actual data
 */

async function applyAttendanceSync() {
  console.log("🔄 Applying Attendance Synchronization Fix...\n");

  try {
    // Get all scholarship attendance records
    const scholarshipRecords = await db
      .select()
      .from(scholarshipAttendance);

    console.log(
      `Found ${scholarshipRecords.length} scholarship attendance records to process\n`
    );

    let updatedCount = 0;
    let noChangeCount = 0;
    let noStudentCount = 0;
    const updates: any[] = [];

    for (const schRecord of scholarshipRecords) {
      // Get admissionMeta to find entryNumber
      const admission = await db
        .select()
        .from(admissionMeta)
        .where(eq(admissionMeta.id, schRecord.admissionId))
        .limit(1);

      if (!admission || admission.length === 0) {
        console.log(
          `⚠️  ${schRecord.admissionId} (${schRecord.month} ${schRecord.year}): Admission not found`
        );
        noStudentCount++;
        continue;
      }

      const entryNumber = admission[0].entryNumber;
      if (!entryNumber) {
        console.log(
          `⚠️  ${schRecord.admissionId}: No entry number found`
        );
        noStudentCount++;
        continue;
      }

      // Find students with this entryNumber
      const studentRecords = await db
        .select()
        .from(students)
        .where(eq(students.studentId, entryNumber));

      if (studentRecords.length === 0) {
        console.log(
          `⚠️  Entry #${entryNumber}: Student record not found in academy`
        );
        noStudentCount++;
        continue;
      }

      // Get all student IDs for this entry
      const studentIds = studentRecords.map((s) => s.id);

      // Get attendance records for these students in this month/year
      const studentAttendanceRecords = await db
        .select()
        .from(studentAttendance)
        .where(
          and(
            sql`"student_attendance"."student_id" IN (${sql.join(studentIds)})`,
            eq(studentAttendance.month, schRecord.month),
            eq(studentAttendance.year, parseInt(schRecord.year))
          )
        );

      if (studentAttendanceRecords.length === 0) {
        console.log(
          `⚠️  Entry #${entryNumber} (${schRecord.month} ${schRecord.year}): No attendance records`
        );
        noStudentCount++;
        continue;
      }

      // Calculate from raw attendance data (P=Present, A=Absent only)
      const presentDays = studentAttendanceRecords.filter(
        (r) => r.status === "P"
      ).length;
      const absentDays = studentAttendanceRecords.filter(
        (r) => r.status === "A"
      ).length;
      const totalDays = presentDays + absentDays;
      const calculatedPercentage =
        totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      // Compare with current values
      const oldPercentage = schRecord.percentage;
      const percentageDiff = Math.abs(calculatedPercentage - oldPercentage);

      if (percentageDiff > 0.5) {
        // Update if difference is > 0.5%
        await db
          .update(scholarshipAttendance)
          .set({
            percentage: calculatedPercentage,
            totalDays,
            presentDays,
          })
          .where(
            and(
              eq(scholarshipAttendance.admissionId, schRecord.admissionId),
              eq(scholarshipAttendance.month, schRecord.month),
              eq(scholarshipAttendance.year, schRecord.year)
            )
          );

        updates.push({
          entry: entryNumber,
          month: schRecord.month,
          year: schRecord.year,
          oldPercentage: oldPercentage.toFixed(2),
          newPercentage: calculatedPercentage.toFixed(2),
          presentDays,
          totalDays,
          difference: percentageDiff.toFixed(2),
        });

        updatedCount++;
        console.log(
          `✅ Updated: Entry #${entryNumber} (${schRecord.month} ${schRecord.year})`
        );
        console.log(
          `   ${oldPercentage.toFixed(2)}% → ${calculatedPercentage.toFixed(2)}% (Δ ${percentageDiff.toFixed(2)}%)\n`
        );
      } else {
        noChangeCount++;
      }
    }

    // Summary
    console.log("\n════════════════════════════════════════════════");
    console.log("📊 SYNCHRONIZATION COMPLETE");
    console.log("════════════════════════════════════════════════");
    console.log(`Total Records Checked: ${scholarshipRecords.length}`);
    console.log(`Records Updated: ${updatedCount}`);
    console.log(`Records Unchanged: ${noChangeCount}`);
    console.log(`Records Skipped: ${noStudentCount}`);

    if (updates.length > 0) {
      console.log("\n📋 Updated Records:");
      console.table(updates);
    }

    console.log(
      `\n✅ Attendance synchronization fix applied successfully!\n`
    );
    return updatedCount;
  } catch (error) {
    console.error("❌ Error applying sync:", error);
    throw error;
  }
}

// Run the fix
(async () => {
  try {
    await applyAttendanceSync();
    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
})();
