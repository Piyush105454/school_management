import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const client = postgres(process.env.DIRECT_URL!);

async function main() {
  try {
    console.log("Creating table teachers...");
    await client`
      CREATE TABLE IF NOT EXISTS "teachers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "contact_number" text,
        "class_assigned" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("Done!");
    process.exit(0);
  } catch (e) {
    console.error("Error creating table:", e);
    process.exit(1);
  }
}

main();
