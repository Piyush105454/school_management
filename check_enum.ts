import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DIRECT_URL!);

async function main() {
    try {
        const enums = await sql`
      SELECT e.enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname = 'role'
    `;
        console.log("--- ROLE ENUM VALUES ---");
        console.log(JSON.stringify(enums, null, 2));

        process.exit(0);
    } catch (e) {
        console.error("ENUM_ERROR:", e);
        process.exit(1);
    }
}

main();
