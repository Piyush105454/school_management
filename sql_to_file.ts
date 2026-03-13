import { db } from "./src/db";
import { admissionMeta } from "@/db/schema";
import { desc } from "drizzle-orm";
import * as fs from 'fs';

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
    const output = `SQL Query:\n${sql.sql}\n\nParams:\n${JSON.stringify(sql.params, null, 2)}`;
    fs.writeFileSync('generated_sql.txt', output);
    console.log("SQL written to generated_sql.txt");
  } catch (err) {
    if (err instanceof Error) {
        fs.writeFileSync('generated_sql.txt', `Failed: ${err.message}`);
    } else {
        fs.writeFileSync('generated_sql.txt', `Failed: ${String(err)}`);
    }
  }
  process.exit(0);
}

inspect();
