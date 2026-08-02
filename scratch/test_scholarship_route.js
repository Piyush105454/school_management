const postgres = require('postgres');
require('dotenv').config({ path: '.env' });

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    const months = ['June'];
    const statuses = ['APPROVED']; // mapped from SCHOLARSHIP FULL AWARDED
    const rows = await sql`
      SELECT id, month, year, status FROM scholarship_records
      WHERE month IN ${sql(months)} AND status IN ${sql(statuses)}
      LIMIT 5
    `;
    console.log("Query successful! Rows returned:", rows.length);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await sql.end();
  }
}

main();
