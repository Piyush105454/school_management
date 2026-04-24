import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DIRECT_URL!, { ssl: 'require' });

async function debugSchema() {
  console.log("Fetching column names for 'student_bio'...");
  try {
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'student_bio'
      ORDER BY ordinal_position;
    `;
    console.log("Actual columns in 'student_bio':");
    columns.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });

    console.log("\nChecking 'admission_meta' for new columns...");
    const metaCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'admission_meta'
      AND column_name IN ('office_remarks', 'document_remarks', 'verification_remarks');
    `;
    metaCols.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
    });

  } catch (err) {
    console.error("Error fetching schema info:", err);
  } finally {
    await sql.end();
  }
}

debugSchema();
