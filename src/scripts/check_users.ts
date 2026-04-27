import "dotenv/config";
import { db } from "../db";
import { users } from "../db/schema";

async function main() {
  const allUsers = await db.query.users.findMany();
  console.log("Users and Roles:");
  allUsers.forEach(u => {
    console.log(`"${u.email}" | "${u.role}"`);
  });
  process.exit(0);
}

main().catch(console.error);
