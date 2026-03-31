import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DIRECT_URL!);

async function main() {
    const testEmail = "raw_test_" + Date.now() + "@example.com";
    console.log(`TEST_RAW_START: ${testEmail}`);

    try {
        await sql`
      INSERT INTO users (email, password, role) 
      VALUES (${testEmail}, 'dummy', 'TEACHER')
    `;
        console.log("INSERT_SUCCESS!");

        const verify = await sql`SELECT * FROM users WHERE email = ${testEmail}`;
        console.log("VERIFY_SUCCESS:", verify.length > 0);

        // Clean up
        await sql`DELETE FROM users WHERE email = ${testEmail}`;
        console.log("CLEANUP_SUCCESS!");

        process.exit(0);
    } catch (e: any) {
        console.error("TEST_RAW_FAILED:", e.message);
        process.exit(1);
    }
}

main();
