import { db } from "../src/db";
import { inquiries } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("=== Querying Inquiry Record for id 99db5fd8-b0f3-4750-91d9-b05e298f2845 ===");
  const record = await db.select().from(inquiries).where(eq(inquiries.id, "99db5fd8-b0f3-4750-91d9-b05e298f2845"));
  console.log("Inquiry Record:", JSON.stringify(record, null, 2));
}

main().catch(console.error);
