import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

const sql = postgres(connectionString, { prepare: false });

async function main() {
  try {
    console.log("🔍 Tracing attendance mismatch for July 5 and 12...\n");

    // Step 1: Show July attendance records
    const julyRecords = await sql`
      SELECT 
        sa.id,
        sa.student_id,
        sa.date,
        TO_CHAR(sa.date, 'Day') as day_name,
        sa.status,
        s.name,
        s.student_id as entry_number
      FROM student_attendance sa
      LEFT JOIN students s ON s.id = sa.student_id
      WHERE sa.month = 'July' 
        AND sa.year = 2026
        AND sa.status IN ('P', 'A')
      ORDER BY sa.date
    `;

    console.log("📊 July Attendance Records (P/A only):");
    console.table(julyRecords);

    // Step 2: Show specifically July 5 and 12 records
    console.log("\n\n🎯 Records for July 5 & 12 specifically:");
    const ghostRecords = await sql`
      SELECT 
        s.name,
        s.id,
        sa.student_id,
        sa.date,
        sa.status,
        sa.month,
        sa.year
      FROM student_attendance sa
      INNER JOIN students s ON s.id = sa.student_id
      WHERE sa.month = 'July'
        AND sa.year = 2026
        AND (EXTRACT(DAY FROM sa.date) = 5 OR EXTRACT(DAY FROM sa.date) = 12)
      ORDER BY s.name, sa.date
    `;

    console.table(ghostRecords);

    if (ghostRecords.length > 0) {
      console.log("\n\n⚠️  Ghost records found! Preparing to delete...");
      
      // Step 3: Count records before deletion
      const beforeCount = await sql`
        SELECT COUNT(*) as count
        FROM student_attendance
        WHERE month = 'July' AND year = 2026 AND status IN ('P', 'A')
      `;

      console.log(`Records before deletion: ${beforeCount[0].count}`);

      // Step 4: Delete ghost records
      const deleteResult = await sql`
        DELETE FROM student_attendance
        WHERE month = 'July'
          AND year = 2026
          AND DATE_TRUNC('day', date) IN ('2026-07-05'::date, '2026-07-12'::date)
          AND status IN ('P', 'A')
      `;

      console.log(`✅ Deleted ${deleteResult.count} ghost records`);

      // Step 5: Verify deletion
      const afterCount = await sql`
        SELECT COUNT(*) as count
        FROM student_attendance
        WHERE month = 'July' AND year = 2026 AND status IN ('P', 'A')
      `;

      console.log(`Records after deletion: ${afterCount[0].count}`);

      console.log("\n\n📋 Final July records after cleanup:");
      const finalRecords = await sql`
        SELECT 
          s.name,
          sa.date,
          TO_CHAR(sa.date, 'Day') as day_name,
          sa.status
        FROM student_attendance sa
        INNER JOIN students s ON s.id = sa.student_id
        WHERE sa.month = 'July' AND sa.year = 2026 AND sa.status IN ('P', 'A')
        ORDER BY sa.date
      `;
      console.table(finalRecords);
    } else {
      console.log("\n✅ No ghost records found - July 5 & 12 are clean!");
    }

    await sql.end();
  } catch (error) {
    console.error("❌ Error:", error);
    await sql.end();
    process.exit(1);
  }
}

main();
