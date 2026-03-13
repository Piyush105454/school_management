import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DIRECT_URL!, { ssl: 'require' });

async function check() {
  try {
    console.log("Listing tables...");
    const tables = await sql`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
    `;
    console.log("Tables:", tables.map(t => t.tablename));

    const targetTables = ['users', 'student_profiles', 'admission_meta', 'entrance_tests'];
    for (const table of targetTables) {
      console.log(`\nChecking columns for table: ${table}`);
      try {
        const columns = await sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = ${table}
        `;
        console.log(columns.map(c => `${c.column_name} (${c.data_type})`));
      } catch (e) {
        console.log(`Error checking table ${table}: ${e.message}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("Critical error:", err);
    process.exit(1);
  }
}

check();
