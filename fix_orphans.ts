import { db } from "./src/db";
import { users, teachers } from "./src/db/schema";
import bcrypt from "bcryptjs";
import { eq, isNull } from "drizzle-orm";

async function main() {
    try {
        console.log("Searching for teachers without user accounts...");
        const orphanedTeachers = await db.select().from(teachers).where(isNull(teachers.userId));
        console.log(`Found ${orphanedTeachers.length} teachers to fix.`);

        for (const teacher of orphanedTeachers) {
            console.log(`Fixing teacher: ${teacher.name}`);

            // We need an email. If we don't have one, we'll generate one based on the name.
            // But ideally we should have it.
            // For this migration, let's use a placeholder or try to find a contact number.
            const safeName = teacher.name.toLowerCase().replace(/\s+/g, '.');
            const email = `${safeName}@schoolflow.com`; // Placeholder email
            const password = "Teacher@123";
            const hashedPassword = await bcrypt.hash(password, 10);

            try {
                const [user] = await db.insert(users).values({
                    email: email,
                    password: hashedPassword,
                    role: "TEACHER",
                    phone: teacher.contactNumber,
                }).returning({ id: users.id });

                await db.update(teachers).set({
                    userId: user.id
                }).where(eq(teachers.id, teacher.id));

                console.log(`Successfully created user ${email} for ${teacher.name}`);
            } catch (e: any) {
                console.error(`Failed to fix ${teacher.name}: ${e.message}`);
            }
        }

        console.log("Migration Completed!");
        process.exit(0);
    } catch (e: any) {
        console.error("MIGRATION_FAILED:", e);
        process.exit(1);
    }
}

main();
