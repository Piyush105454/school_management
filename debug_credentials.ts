import { db } from "./src/db";
import { users } from "./src/db/schema";
import bcrypt from "bcryptjs";

async function main() {
    try {
        const testPassword = "Teacher@123";
        const hashed = await bcrypt.hash(testPassword, 10);
        const isValid = await bcrypt.compare(testPassword, hashed);
        console.log("BCRYPT_TEST: Hash and compare works:", isValid);

        const allUsers = await db.select().from(users);
        console.log("--- USERS IN DB ---");
        for (const user of allUsers) {
            if (user.role === "TEACHER") {
                const checkDefault = await bcrypt.compare("Teacher@123", user.password);
                console.log(`Email: ${user.email}, Role: ${user.role}, PasswordMatchesDefault: ${checkDefault}`);
            }
        }

        process.exit(0);
    } catch (e: any) {
        console.error("DEBUG_ERROR:", e);
        process.exit(1);
    }
}

main();
