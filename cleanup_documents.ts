import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!, { ssl: 'require' });

async function cleanup() {
  try {
    console.log("Cleaning up student_documents table records...");

    const res = await sql`
      UPDATE student_documents
      SET 
        birth_certificate = NULLIF(NULLIF(birth_certificate, '__EXISTING__'), ''),
        student_photo = NULLIF(NULLIF(student_photo, '__EXISTING__'), ''),
        marksheet = NULLIF(NULLIF(marksheet, '__EXISTING__'), ''),
        caste_certificate = NULLIF(NULLIF(caste_certificate, '__EXISTING__'), ''),
        affidavit = NULLIF(NULLIF(affidavit, '__EXISTING__'), ''),
        transfer_certificate = NULLIF(NULLIF(transfer_certificate, '__EXISTING__'), ''),
        scholarship_slip = NULLIF(NULLIF(scholarship_slip, '__EXISTING__'), '')
      WHERE 
        birth_certificate IN ('__EXISTING__', '') OR
        student_photo IN ('__EXISTING__', '') OR
        marksheet IN ('__EXISTING__', '') OR
        caste_certificate IN ('__EXISTING__', '') OR
        affidavit IN ('__EXISTING__', '') OR
        transfer_certificate IN ('__EXISTING__', '') OR
        scholarship_slip IN ('__EXISTING__', '')
    `;

    console.log(`Cleanup Complete! Updated ${res.count} rows.`);
    process.exit(0);
  } catch (err) {
    console.error("Error during cleanup:", err);
    process.exit(1);
  }
}

cleanup();
