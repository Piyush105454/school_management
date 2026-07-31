const postgres = require('postgres');
require('dotenv').config({ path: '.env' });

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    const rows = await sql`SELECT id, status, reviewer_id, approver_id, reviewer_remark, principal_remark FROM lesson_plans WHERE id = 'LP-2627-DEMO-TEST-0003'`;
    if (rows.length > 0) {
      console.log(JSON.stringify(rows[0], null, 2));
    } else {
      console.log("No plan found with ID LP-2627-DEMO-TEST-0003");
    }
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await sql.end();
  }
}

main();
