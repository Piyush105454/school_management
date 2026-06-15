import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./src/db/schema";

const db = drizzle(postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 }), { schema });

async function main() {
  const users = await db.query.users.findMany({ columns: { id: true, email: true, role: true } });
  console.log("ALL USERS AND ROLES:");
  users.forEach(u => console.log(u.role.padEnd(16) + u.email));
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
