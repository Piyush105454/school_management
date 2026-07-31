const postgres = require('postgres');
require('dotenv').config({ path: '.env' });

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    const [plan] = await sql`
      SELECT lp.id, lp.reviewer_id, lp.approver_id, lp.subject_id,
             s.name as subject_name, s.reviewer_id_1, s.reviewer_id_2
      FROM lesson_plans lp
      JOIN subjects s ON lp.subject_id = s.id
      WHERE lp.id = 'LP-2627-DEMO-TEST-0003'
    `;
    console.log("Plan details:", JSON.stringify(plan, null, 2));

    const reviewers = await sql`
      SELECT id, user_id, name, assigned_role FROM teachers
      WHERE id IN (${plan.reviewer_id_1}, ${plan.reviewer_id_2})
         OR user_id IN (${plan.reviewer_id}, ${plan.approver_id})
    `;
    console.log("Teachers found:", JSON.stringify(reviewers, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await sql.end();
  }
}

main();
