import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!, { ssl: 'require' });

async function main() {
  const settings = await sql`
    SELECT DISTINCT academic_year FROM scholarship_criteria_settings;
  `;
  console.log("Distinct academic years in criteria settings:", settings);

  const metaYears = await sql`
    SELECT DISTINCT academic_year FROM admission_meta;
  `;
  console.log("Distinct academic years in admission_meta:", metaYears);

  const allSettings = await sql`
    SELECT * FROM scholarship_criteria_settings;
  `;
  console.log("All criteria settings rows:", allSettings);

  await sql.end();
}

main().catch(console.error);
