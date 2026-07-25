import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!, { ssl: 'require' });

async function main() {
  const classes = await sql`SELECT DISTINCT name FROM classes`;
  console.log("Classes from `classes` table:", classes);

  const inquiriesClasses = await sql`SELECT DISTINCT applied_class FROM inquiries`;
  console.log("Classes from `inquiries` table:", inquiriesClasses);

  await sql.end();
}

main().catch(console.error);
