import { db } from "./src/db";
import { admissionMeta } from "@/db/schema";
import { desc } from "drizzle-orm";

async function test() {
  try {
    console.log("Running simplified query...");
    const applicants = await db.query.admissionMeta.findMany({
      with: {
          inquiry: true,
          entranceTest: true,
      },
      orderBy: [desc(admissionMeta.createdAt)]
    });
    console.log("Success! Fetched", applicants.length, "applicants.");
  } catch (err) {
    console.error("Query failed:", err);
  }
  process.exit(0);
}

test();
