import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const client = postgres(process.env.DIRECT_URL!);

async function main() {
    try {
        console.log("Updating role enum...");
        // Postgres enum addition needs to be outside a transaction in some versions, 
        // but try-catch should handle if it already exists.
        try {
            await client`ALTER TYPE "role" ADD VALUE 'TEACHER'`;
            console.log("Added TEACHER to role enum.");
        } catch (e: any) {
            if (e.message.includes("already exists")) {
                console.log("TEACHER already exists in role enum.");
            } else {
                throw e;
            }
        }

        console.log("Updating teachers table...");
        await client`
      ALTER TABLE "teachers" 
      ADD COLUMN IF NOT EXISTS "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE;
    `;
        console.log("Added user_id to teachers table.");

        console.log("Database Fix Completed!");
        process.exit(0);
    } catch (e) {
        console.error("Error fixing database:", e);
        process.exit(1);
    }
}

main();
