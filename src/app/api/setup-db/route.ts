import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Starting DB setup...");
    
    await db.execute(sql`
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
    `);

    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_documents_admission_id_admission_meta_id_fk') THEN
          ALTER TABLE "student_documents" 
          ADD CONSTRAINT "student_documents_admission_id_admission_meta_id_fk" 
          FOREIGN KEY ("admission_id") REFERENCES "admission_meta"("id") 
          ON DELETE cascade ON UPDATE no action;
        END IF;
      END $$;
    `);

    console.log("DB setup completed.");
    return NextResponse.json({ success: true, message: "Table created or already exists." });
  } catch (error: any) {
    console.error("DB setup error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
