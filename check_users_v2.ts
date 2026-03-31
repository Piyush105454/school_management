import { db } from "./src/db";
import { users, teachers } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    try {
        const allUsers = await db.select().from(users);
        console.log("--- ALL USERS ---");
        console.log(JSON.stringify(allUsers.map(u => ({ email: u.email, role: u.role, phone: u.phone })), null, 2));

        const allTeachers = await db.select().from(teachers);
        console.log("--- ALL TEACHERS ---");
        console.log(JSON.stringify(allTeachers.map(t => ({ name: t.name, userId: t.userId, contact: t.contactNumber })), null, 2));

        process.exit(0);
    } catch (e: any) {
        console.error("Error checking users:", e);
        process.exit(1);
    }
}

main();
