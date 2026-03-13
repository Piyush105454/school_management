import { db } from "./src/db";
import { admissionMeta } from "@/db/schema";
import { desc } from "drizzle-orm";

async function inspect() {
  try {
    const query = db.query.admissionMeta.findMany({
      with: {
          inquiry: true,
          entranceTest: true,
          studentProfile: true
      },
      orderBy: [desc(admissionMeta.createdAt)]
    });

    // @ts-ignore
    const sql = query.toSQL();
    console.log("SQL Query:");
    console.log(sql.sql);
    console.log("\nParams:");
    console.log(sql.params);
  } catch (err) {
    console.error("Failed to generate SQL:", err);
  }
  process.exit(0);
}

inspect();
