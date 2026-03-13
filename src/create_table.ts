import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const client = postgres(process.env.DIRECT_URL!);

async function main() {
  try {
    console.log("Creating table student_documents...");
    await client`
      CREATE TABLE IF NOT EXISTS "student_documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "admission_id" uuid NOT NULL,
        "birth_certificate" text,
        "student_photo" text,
        "marksheet" text,
        "caste_certificate" text,
        "affidavit" text,
        "transfer_certificate" text,
        "scholarship_slip" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "student_documents_admission_id_unique" UNIQUE("admission_id")
      );
    `;
    
    console.log("Adding foreign key constraint...");
    await client`
      ALTER TABLE "student_documents" 
      DROP CONSTRAINT IF EXISTS "student_documents_admission_id_admission_meta_id_fk",
      ADD CONSTRAINT "student_documents_admission_id_admission_meta_id_fk" 
      FOREIGN KEY ("admission_id") REFERENCES "admission_meta"("id") 
      ON DELETE cascade ON UPDATE no action;
    `;
    
    console.log("Done!");
    process.exit(0);
  } catch (e) {
    console.error("Error creating table:", e);
    process.exit(1);
  }
}

main();
