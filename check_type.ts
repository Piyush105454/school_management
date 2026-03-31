import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DIRECT_URL!);

async function main() {
    try {
        const columnType = await sql`
      SELECT udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `;
        console.log("--- ROLE COLUMN TYPE ---");
        console.log(JSON.stringify(columnType, null, 2));

        process.exit(0);
    } catch (e) {
        console.error("DB_ERROR:", e);
        process.exit(1);
    }
}

main();
