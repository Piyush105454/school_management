import { db } from "./src/db";
import { users, teachers } from "./src/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const testEmail = "app_db_test_" + Date.now() + "@example.com";
    console.log(`TEST_APP_DB_START: ${testEmail}`);

    try {
        const hashedPassword = await bcrypt.hash("Teacher@123", 10);

        console.log("INSERTING_USER...");
        const userResult = await db.insert(users).values({
            email: testEmail,
            password: hashedPassword,
            role: "TEACHER",
        }).returning({ id: users.id });

        console.log("USER_RESULT:", JSON.stringify(userResult));
        const userId = userResult[0]?.id;
        console.log("USER_ID:", userId);

        if (!userId) {
            throw new Error("User ID was not returned");
        }

        console.log("INSERTING_TEACHER...");
        const teacherResult = await db.insert(teachers).values({
            userId: userId,
            name: "App DB Test Teacher",
        }).returning({ id: teachers.id });

        console.log("TEACHER_RESULT:", JSON.stringify(teacherResult));

        console.log("VERIFYING...");
        const verifiedUser = await db.query.users.findFirst({
            where: eq(users.id, userId)
        });
        console.log("VERIFIED_USER_EXISTS:", !!verifiedUser);

        console.log("TEST_APP_DB_SUCCESS!");
        process.exit(0);
    } catch (e: any) {
        console.error("TEST_APP_DB_FAILED:", e.message);
        process.exit(1);
    }
}

main();
