import "dotenv/config";
import postgres from "postgres";

async function migrate() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("No DB connection string found.");

  const sql = postgres(connectionString, { ssl: "require", max: 1 });

  console.log("Adding 'institute' column to scholarship_criteria_settings...");

  await sql`
    ALTER TABLE scholarship_criteria_settings
    ADD COLUMN IF NOT EXISTS institute TEXT DEFAULT NULL;
  `;
  console.log("✅ Column 'institute' added.");

  await sql`
    DROP INDEX IF EXISTS academic_year_admission_idx;
  `;
  console.log("✅ Old unique index dropped.");

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS academic_year_admission_institute_idx
    ON scholarship_criteria_settings (
      academic_year,
      COALESCE(admission_id::text, ''),
      COALESCE(institute, '')
    );
  `;
  console.log("✅ New unique index created (academic_year + admission_id + institute).");

  await sql.end();
  console.log("🎉 Migration complete! Each school now has its own separate criteria row.");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
