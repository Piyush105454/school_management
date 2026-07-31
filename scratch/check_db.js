const postgres = require('postgres');
require('dotenv').config({ path: '.env' });

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    const rows = await sql`SELECT id, status, step2_data FROM lesson_plans WHERE id = 'LP-2627-C7-DEMO-0001'`;
    if (rows.length > 0) {
      console.log("Raw step2Data of plan LP-2627-C7-DEMO-0001:");
      console.log(rows[0].step2_data);
    }
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await sql.end();
  }
}

main();
