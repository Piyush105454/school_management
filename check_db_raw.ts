import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DIRECT_URL!);

async function main() {
    try {
        const rolesCount = await sql`SELECT role, count(*) FROM users GROUP BY role`;
        console.log("--- USERS BY ROLE ---");
        console.log(JSON.stringify(rolesCount, null, 2));

        // Check if there are ANY teachers at all
        const teachersCount = await sql`SELECT count(*) FROM teachers`;
        console.log("--- TEACHERS COUNT ---");
        console.log(JSON.stringify(teachersCount, null, 2));

        process.exit(0);
    } catch (e) {
        console.error("DB_ERROR:", e);
        process.exit(1);
    }
}

main();
