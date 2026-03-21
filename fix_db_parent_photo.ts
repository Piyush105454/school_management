import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const client = postgres(process.env.DIRECT_URL!);

async function fix() {
  try {
    console.log("Adding photo column to parent_guardian_details if not exists...");
    await client`
      ALTER TABLE "parent_guardian_details" ADD COLUMN IF NOT EXISTS "photo" text;
    `;
    console.log("Database updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error updating database:", err);
    process.exit(1);
  }
}

fix();
