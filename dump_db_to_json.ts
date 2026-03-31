import postgres from "postgres";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const sql = postgres(process.env.DIRECT_URL!);

async function main() {
    try {
        const users = await sql`SELECT id, email, role, phone FROM users`;
        const teachers = await sql`SELECT id, name, user_id, contact_number FROM teachers`;

        const dump = {
            users,
            teachers
        };

        fs.writeFileSync('c:/Users/piyus/.gemini/antigravity/scratch/school_platform_project/db_dump.json', JSON.stringify(dump, null, 2));
        console.log("Dump written to db_dump.json");
        process.exit(0);
    } catch (e) {
        console.error("DB_ERROR:", e);
        process.exit(1);
    }
}

main();
