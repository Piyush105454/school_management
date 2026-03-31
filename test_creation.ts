import { db } from "./src/db";
import { users, teachers } from "./src/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
    const testEmail = "test_teacher_" + Date.now() + "@example.com";
    console.log(`TEST_START: ${testEmail}`);

    try {
        const hashedPassword = await bcrypt.hash("Teacher@123", 10);

        console.log("INSERTING_USER...");
        const userResult = await db.insert(users).values({
            email: testEmail,
            password: hashedPassword,
            role: "TEACHER",
        }).returning({ id: users.id });

        const user = userResult[0];
        console.log("USER_RESULT:", JSON.stringify(userResult));
        console.log("USER_ID:", user?.id);

        if (!user?.id) {
            throw new Error("User ID was not returned");
        }

        console.log("INSERTING_TEACHER...");
        const teacherResult = await db.insert(teachers).values({
            userId: user.id,
            name: "Test Teacher",
        }).returning({ id: teachers.id });

        console.log("TEACHER_RESULT:", JSON.stringify(teacherResult));

        console.log("VERIFYING_USER_IN_DB...");
        const verifiedUser = await db.query.users.findFirst({
            where: eq(users.id, user.id)
        });
        console.log("VERIFIED_USER:", !!verifiedUser);

        console.log("TEST_SUCCESS!");
        process.exit(0);
    } catch (e: any) {
        console.error("TEST_FAILED:", e.message);
        if (e.stack) console.error(e.stack);
        process.exit(1);
    }
}

main();
