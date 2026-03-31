import { db } from "./src/db";
import { users } from "./src/db/schema";

async function main() {
    const allUsers = await db.select().from(users);
    console.log("Users in DB:", allUsers.map(u => ({ email: u.email, role: u.role })));
    process.exit(0);
}

main();
