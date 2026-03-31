import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DIRECT_URL!);

async function main() {
    try {
        const users = await sql`SELECT email, role, phone FROM users`;
        console.log("--- ACTUAL USERS IN DB ---");
        console.log(JSON.stringify(users, null, 2));

        // Also check teachers
        const teachers = await sql`SELECT name, user_id FROM teachers`;
        console.log("--- ACTUAL TEACHERS IN DB ---");
        console.log(JSON.stringify(teachers, null, 2));

        process.exit(0);
    } catch (e) {
        console.error("DB_ERROR:", e);
        process.exit(1);
    }
}

main();
