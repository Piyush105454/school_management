const postgres = require('postgres');
require('dotenv').config({ path: '.env' });

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    const teachers = await sql`
      SELECT id, user_id, name, assigned_role FROM teachers
      WHERE user_id IN ('3a169c87-830c-42a3-9565-3ffa72d165d3', '040dd3c6-c237-4f51-8dd9-008e36424935')
    `;
    console.log("Teachers found:", JSON.stringify(teachers, null, 2));

    const users = await sql`
      SELECT id, email, role FROM users
      WHERE id IN ('3a169c87-830c-42a3-9565-3ffa72d165d3', '040dd3c6-c237-4f51-8dd9-008e36424935')
    `;
    console.log("Users found:", JSON.stringify(users, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await sql.end();
  }
}

main();
