import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const client = postgres(process.env.DIRECT_URL!);
const db = drizzle(client);

async function main() {
  try {
    const result = await client`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log("Tables found:", result.map(t => t.table_name));
    process.exit(0);
  } catch (e) {
    console.error("Error connecting to DB:", e);
    process.exit(1);
  }
}

main();
