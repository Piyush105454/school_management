import { db } from "./src/db";
import * as dotenv from "dotenv";
dotenv.config();

async function check() {
  try {
    const inquiries = await db.query.inquiries.findMany({
      columns: {
        studentName: true,
        entryNumber: true,
      },
      limit: 10
    });
    console.log("Current Inquiries:", JSON.stringify(inquiries, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
