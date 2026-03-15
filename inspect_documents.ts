import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!, { ssl: 'require' });

async function check() {
  try {
    console.log("Querying student_documents...");
    const docs = await sql`
      SELECT id, admission_id, affidavit
      FROM student_documents
      LIMIT 10
    `;
    
    console.log(`Found ${docs.length} rows.`);
    docs.forEach(d => {
      console.log(`ID: ${d.id}`);
      console.log(`Admission ID: ${d.admission_id}`);
      console.log(`Affidavit Length: ${d.affidavit ? d.affidavit.length : 'NULL'}`);
      console.log(`Is Affidivat Empty String: ${d.affidavit === ''}`);
      if (d.affidavit && d.affidavit.length > 0) {
         console.log(`Affidavit Snippet: ${d.affidavit.substring(0, 30)}...`);
      }
      console.log("-------------------");
    });

    process.exit(0);
  } catch (err) {
    console.error("Error checking documents:", err);
    process.exit(1);
  }
}

check();
