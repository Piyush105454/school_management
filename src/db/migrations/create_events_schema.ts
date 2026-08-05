import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Starting database migration for events & milestones schema...");
  try {
    // 1. Create school_events table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS school_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        detail text,
        meet_link text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Created table 'school_events' if it didn't exist.");

    // 2. Create school_event_owners table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS school_event_owners (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id uuid NOT NULL REFERENCES school_events(id) ON DELETE CASCADE,
        teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE
      );
    `);
    console.log("Created table 'school_event_owners' if it didn't exist.");

    // 3. Create school_event_milestones table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS school_event_milestones (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id uuid NOT NULL REFERENCES school_events(id) ON DELETE CASCADE,
        title text NOT NULL,
        date text NOT NULL
      );
    `);
    console.log("Created table 'school_event_milestones' if it didn't exist.");

    // 4. Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS school_event_owners_event_idx ON school_event_owners (event_id);
      CREATE INDEX IF NOT EXISTS school_event_owners_teacher_idx ON school_event_owners (teacher_id);
      CREATE INDEX IF NOT EXISTS school_event_milestones_event_idx ON school_event_milestones (event_id);
      CREATE INDEX IF NOT EXISTS school_event_milestones_date_idx ON school_event_milestones (date);
    `);
    console.log("Created indexes for owners and milestones.");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
