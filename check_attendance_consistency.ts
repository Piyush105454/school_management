import { db } from "@/db";
import { studentAttendance, scholarshipAttendance } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Script to check and fix attendance percentage inconsistencies
 * between studentAttendance and scholarshipAttendance tables
 */

async function checkAttendanceConsistency() {
  console.log("🔍 Starting Attendance Consistency Check...\n");

  try {
    // Get all scholarship attendance records
    const scholarshipRecords = await db
      .select()
      .from(scholarshipAttendance);

    console.log(`Found ${scholarshipRecords.length} scholarship attendance records\n`);

    let inconsistencies = 0;
    const issues: any[] = [];

    for (const schRecord of scholarshipRecords) {
      // Calculate from studentAttendance table
      const studentAttendanceRecords = await db
        .select()
        .from(studentAttendance)
        .where(
          and(
            eq(studentAttendance.admissionId, schRecord.admissionId),
            eq(studentAttendance.month, schRecord.month),
            eq(studentAttendance.year, schRecord.year)
          )
        );

      if (studentAttendanceRecords.length === 0) {
        issues.push({
          admissionId: schRecord.admissionId,
          month: schRecord.month,
          year: schRecord.year,
          issue: "No student attendance records found",
          scholarshipPercentage: schRecord.percentage,
        });
        inconsistencies++;
        continue;
      }

      // Calculate present and total days
      const presentDays = studentAttendanceRecords.filter(
        (r: any) => r.status === "P"
      ).length;
      const absentDays = studentAttendanceRecords.filter(
        (r: any) => r.status === "A"
      ).length;
      const totalDays = presentDays + absentDays;
      const calculatedPercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      // Compare
      const recordedPercentage = schRecord.percentage;
      const percentageDiff = Math.abs(calculatedPercentage - recordedPercentage);

      if (percentageDiff > 0.5) {
        // Allow 0.5% tolerance
        issues.push({
          admissionId: schRecord.admissionId,
          month: schRecord.month,
          year: schRecord.year,
          recordedPercentage,
          calculatedPercentage,
          presentDays,
          absentDays,
          totalDays,
          difference: percentageDiff,
        });
        inconsistencies++;
      }
    }

    if (inconsistencies === 0) {
      console.log("✅ All attendance records are consistent!\n");
    } else {
      console.log(`⚠️  Found ${inconsistencies} inconsistencies:\n`);
      console.table(issues);
    }

    return {
      totalRecords: scholarshipRecords.length,
      inconsistencies,
      issues,
    };
  } catch (error) {
    console.error("❌ Error checking consistency:", error);
    throw error;
  }
}

async function syncAttendancePercentages() {
  console.log("🔄 Syncing Attendance Percentages...\n");

  try {
    const scholarshipRecords = await db
      .select()
      .from(scholarshipAttendance);

    let syncedCount = 0;

    for (const schRecord of scholarshipRecords) {
      const studentAttendanceRecords = await db
        .select()
        .from(studentAttendance)
        .where(
          and(
            eq(studentAttendance.admissionId, schRecord.admissionId),
            eq(studentAttendance.month, schRecord.month),
            eq(studentAttendance.year, schRecord.year)
          )
        );

      const presentDays = studentAttendanceRecords.filter(
        (r: any) => r.status === "P"
      ).length;
      const absentDays = studentAttendanceRecords.filter(
        (r: any) => r.status === "A"
      ).length;
      const totalDays = presentDays + absentDays;
      const calculatedPercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      if (
        Math.abs(calculatedPercentage - schRecord.percentage) > 0.5
      ) {
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

        console.log(
          `✅ Updated: ${schRecord.admissionId} - ${schRecord.month} ${schRecord.year}`
        );
        console.log(
          `   Old: ${schRecord.percentage.toFixed(2)}% → New: ${calculatedPercentage.toFixed(2)}%\n`
        );
        syncedCount++;
      }
    }

    console.log(`🎉 Synced ${syncedCount} records!\n`);
    return syncedCount;
  } catch (error) {
    console.error("❌ Error syncing attendance:", error);
    throw error;
  }
}

// Run checks
(async () => {
  console.log("════════════════════════════════════════════════\n");
  const results = await checkAttendanceConsistency();
  
  if (results.inconsistencies > 0) {
    console.log("════════════════════════════════════════════════\n");
    const proceed = await userConfirm("Fix inconsistencies? (yes/no): ");
    
    if (proceed.toLowerCase() === "yes") {
      await syncAttendancePercentages();
    }
  }
  
  console.log("════════════════════════════════════════════════");
})();

function userConfirm(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once("data", (data) => {
      resolve(data.toString().trim());
    });
  });
}
