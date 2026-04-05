import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing");
  process.exit(1);
}

const sql = postgres(connectionString);

async function truncate() {
  try {
    console.log("Truncating inquiries table...");
    await sql`TRUNCATE TABLE inquiries CASCADE;`;
    console.log("Success!");
  } catch (err) {
    console.error("Truncation failed:", err);
  } finally {
    await sql.end();
  }
}

truncate();
