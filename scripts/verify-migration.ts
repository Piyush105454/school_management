import "dotenv/config";
import postgres from "postgres";

const DB_URL = "postgresql://neondb_owner:npg_GMHq6e9zEanu@ep-steep-truth-adyyasdg-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = postgres(DB_URL, { ssl: "require" });

async function check() {
  try {
    const rows = await sql`
      SELECT student_name, student_photo 
      FROM student_documents sd
      JOIN admission_meta am ON sd.admission_id = am.id
      JOIN inquiries i ON am.inquiry_id = i.id
      WHERE student_photo IS NOT NULL AND student_photo LIKE 'https://%'
      LIMIT 5
    `;
    console.log("Verified Migrated Records (First 5):");
    console.table(rows);
    
    const count = await sql`
      SELECT count(*) FROM student_documents WHERE student_photo LIKE 'https://%'
    `;
    console.log(`Total documents successfully migrated to S3: ${count[0].count}`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
