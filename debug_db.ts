import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function check() {
  try {
    console.log("Checking tables...");
    const tables = await sql`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
    `;
    console.log("Tables:", tables.map(t => t.tablename));

    console.log("\nChecking 'student_profiles' columns...");
    try {
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'student_profiles'
        `;
        console.log("student_profiles columns:", columns.map(c => `${c.column_name} (${c.data_type})`));
    } catch (e) {
        console.log("Error checking student_profiles:", e.message);
    }

    process.exit(0);
  } catch (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
}

check();
