const postgres = require('postgres');
require('dotenv').config({ path: '.env' });

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    const rows = await sql`SELECT id, status, reviewer_id, approver_id, reviewer_remark, principal_remark FROM lesson_plans WHERE id = 'LP-2627-C5-MATH-0001'`;
    console.log("Plan LP-2627-C5-MATH-0001 details:", JSON.stringify(rows[0] || null, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await sql.end();
  }
}

main();
