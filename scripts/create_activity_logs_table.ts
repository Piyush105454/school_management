import "dotenv/config";
import { db } from "../src/db/index";
import { sql } from "drizzle-orm";
import { activityLogs } from "../src/db/schema";

async function main() {
  try {
    console.log("Creating activity_logs table if not exists...");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "activity_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "user_email" text,
        "user_name" text,
        "user_role" text,
        "action" text NOT NULL,
        "module" text NOT NULL,
        "details" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `);
    console.log("Table activity_logs created (or already exists).");

    // Seed historical demo logs
    console.log("Seeding historical activity logs...");
    const now = new Date("2026-08-04T18:51:00+05:30");
    const logs = [
      {
        userEmail: "alisha@wesedu.in",
        userName: "Alisha",
        userRole: "TEACHER",
        action: "UPDATE",
        module: "Lesson Plans",
        details: 'Submitted/updated feedback for session: "While loops and loop control (break, continue)" (Class: CCC EMP Fellow, Role: Facilitator, Status: in_progress)',
        createdAt: new Date(now.getTime() - 1 * 60000),
      },
      {
        userEmail: "alisha@wesedu.in",
        userName: "System User",
        userRole: "SYSTEM",
        action: "UPDATE",
        module: "Lesson Plans",
        details: 'Updated session details for: "While loops and loop control (break, continue)"',
        createdAt: new Date(now.getTime() - 2 * 60000),
      },
      {
        userEmail: "alisha@wesedu.in",
        userName: "Alisha",
        userRole: "TEACHER",
        action: "UPDATE",
        module: "Lesson Plans",
        details: 'Submitted/updated feedback for session: "While loops and loop control (break, continue)" (Class: CCC EMP Fellow, Role: Facilitator, Status: in_progress)',
        createdAt: new Date(now.getTime() - 11 * 60000),
      },
      {
        userEmail: "alisha@wesedu.in",
        userName: "System User",
        userRole: "SYSTEM",
        action: "UPDATE",
        module: "Lesson Plans",
        details: 'Updated session details for: "While loops and loop control (break, continue)"',
        createdAt: new Date(now.getTime() - 12 * 60000),
      },
      {
        userEmail: "alisha@wesedu.in",
        userName: "Alisha",
        userRole: "TEACHER",
        action: "UPDATE",
        module: "Lesson Plans",
        details: 'Submitted/updated feedback for session: "While loops and loop control (break, continue)" (Class: CCC EMP Fellow, Role: Facilitator, Status: in_progress)',
        createdAt: new Date(now.getTime() - 32 * 60000),
      },
      {
        userEmail: "admin@dps.edu.in",
        userName: "Admin Officer",
        userRole: "OFFICE",
        action: "CREATE",
        module: "Scholarship",
        details: 'Awarded scholarship to student Ravi Kumar for academic year 2026-27 (DPS Dhanpuri)',
        createdAt: new Date(now.getTime() - 55 * 60000),
      },
      {
        userEmail: "admin@dps.edu.in",
        userName: "Admin Officer",
        userRole: "OFFICE",
        action: "UPDATE",
        module: "Attendance",
        details: 'Updated daily attendance for Class 8A on 4 Aug 2026 — 32 students marked (DPS Dhanpuri)',
        createdAt: new Date(now.getTime() - 90 * 60000),
      },
      {
        userEmail: "teacher.prashant@dps.edu.in",
        userName: "Prashant Singh",
        userRole: "TEACHER",
        action: "CREATE",
        module: "Lesson Plans",
        details: 'Created Lesson Plan for Class 7 — Subject: Mathematics, Topic: "Fractions and Decimals" (Status: DRAFT)',
        createdAt: new Date(now.getTime() - 120 * 60000),
      },
      {
        userEmail: "student.ravi@wesedu.in",
        userName: "Ravi Kumar",
        userRole: "STUDENT_PARENT",
        action: "ADD",
        module: "Admissions",
        details: 'Student submitted Admission Form — Step 5 (Parent/Guardian Details) completed',
        createdAt: new Date(now.getTime() - 150 * 60000),
      },
      {
        userEmail: "admin@dps.edu.in",
        userName: "Admin Officer",
        userRole: "OFFICE",
        action: "DELETE",
        module: "Attendance",
        details: 'Deleted ghost attendance record for student Mohan Das — 3 Aug 2026 (fix_ghost_attendance script)',
        createdAt: new Date(now.getTime() - 180 * 60000),
      },
      {
        userEmail: "developer@wesedu.in",
        userName: "Developer",
        userRole: "ADMIN",
        action: "SQL",
        module: "Database",
        details: 'Executed migration: ALTER TABLE subjects ADD COLUMN reviewer_id_1, reviewer_id_2 (production fix)',
        createdAt: new Date(now.getTime() - 240 * 60000),
      },
      {
        userEmail: "teacher.arun@dps.edu.in",
        userName: "Arun Sharma",
        userRole: "TEACHER",
        action: "UPDATE",
        module: "Scholarship",
        details: 'PTM attendance marked for 12 students — Month: July 2026 (DPS Dhanpuri)',
        createdAt: new Date(now.getTime() - 300 * 60000),
      },
      {
        userEmail: "admin@dps.edu.in",
        userName: "Admin Officer",
        userRole: "OFFICE",
        action: "UPDATE",
        module: "Scholarship",
        details: 'Scholarship criteria updated — Attendance threshold set to 85% for academic year 2026-27 (Institute: DPS Dhanpuri)',
        createdAt: new Date(now.getTime() - 360 * 60000),
      },
      {
        userEmail: "developer@wesedu.in",
        userName: "Developer",
        userRole: "ADMIN",
        action: "SQL",
        module: "Database",
        details: 'Ran bulk scholarship recalculation: fix_june_scholarship_amounts.sql — Updated 38 records',
        createdAt: new Date(now.getTime() - 420 * 60000),
      },
      {
        userEmail: "teacher.priya@dps.edu.in",
        userName: "Priya Mehta",
        userRole: "TEACHER",
        action: "CREATE",
        module: "Incident Management",
        details: 'Logged discipline incident for student Aman Verma — Class 6B, Category: Behaviour (DPS Dhanpuri)',
        createdAt: new Date(now.getTime() - 480 * 60000),
      },
      {
        userEmail: "admin@dps.edu.in",
        userName: "Admin Officer",
        userRole: "OFFICE",
        action: "UPDATE",
        module: "People Management",
        details: 'Teacher profile updated — Prashant Singh assigned to Class 7, 8 (DPS Dhanpuri)',
        createdAt: new Date(now.getTime() - 540 * 60000),
      },
      {
        userEmail: "student.seema@wesedu.in",
        userName: "Seema Patel",
        userRole: "STUDENT_PARENT",
        action: "ADD",
        module: "Leave Management",
        details: 'Leave application submitted — Student: Seema Patel, Duration: 5 Aug – 7 Aug 2026, Reason: Medical',
        createdAt: new Date(now.getTime() - 600 * 60000),
      },
      {
        userEmail: "admin@dps.edu.in",
        userName: "Admin Officer",
        userRole: "OFFICE",
        action: "CREATE",
        module: "Admissions",
        details: 'Final approval granted for admission of Rahul Sharma — Class 9 (DPS Dhanpuri)',
        createdAt: new Date(now.getTime() - 720 * 60000),
      },
      {
        userEmail: "system",
        userName: "System User",
        userRole: "SYSTEM",
        action: "SYSTEM",
        module: "Attendance",
        details: 'Nightly attendance sync completed — 3 Aug 2026: 285 student attendance records updated across 12 classes',
        createdAt: new Date(now.getTime() - 1440 * 60000),
      },
      {
        userEmail: "developer@wesedu.in",
        userName: "Developer",
        userRole: "ADMIN",
        action: "SQL",
        module: "Database",
        details: 'Ran check_and_fix_attendance_data.sql — Corrected 6 mismatched attendance statuses',
        createdAt: new Date(now.getTime() - 2880 * 60000),
      },
    ];

    for (const log of logs) {
      await db.insert(activityLogs).values({
        userId: null,
        userEmail: log.userEmail,
        userName: log.userName,
        userRole: log.userRole,
        action: log.action,
        module: log.module,
        details: log.details,
        createdAt: log.createdAt,
      } as any);
    }

    console.log(`Seeded ${logs.length} historical activity log entries.`);
    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
