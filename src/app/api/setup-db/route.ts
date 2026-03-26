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

    console.log("Setting up Academy tables and seed data...");
    await db.execute(sql`
      -- 1. Create Tables
      CREATE TABLE IF NOT EXISTS "classes" (
        "id" SERIAL PRIMARY KEY,
        "name" text NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "subjects" (
        "id" SERIAL PRIMARY KEY,
        "class_id" integer NOT NULL REFERENCES "classes"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "medium" text DEFAULT 'English/Hindi' NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "units" (
        "id" SERIAL PRIMARY KEY,
        "subject_id" integer NOT NULL REFERENCES "subjects"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "order_no" integer NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "chapters" (
        "id" SERIAL PRIMARY KEY,
        "unit_id" integer NOT NULL REFERENCES "units"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "chapter_no" integer NOT NULL,
        "page_start" integer NOT NULL,
        "page_end" integer NOT NULL,
        "order_no" integer NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "chapter_pdfs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "chapter_id" integer NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
        "file_url" text NOT NULL,
        "uploaded_by" text,
        "uploaded_at" timestamp DEFAULT now() NOT NULL
      );

      -- 2. Seed Classes
      INSERT INTO "classes" ("id", "name") VALUES 
        (1, 'Class 1'), (2, 'Class 2'), (3, 'Class 3'), (4, 'Class 4'), 
        (5, 'Class 5'), (6, 'Class 6'), (7, 'Class 7'), (8, 'Class 8')
      ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name";
      
      SELECT setval(pg_get_serial_sequence('classes', 'id'), coalesce(max(id), 0) + 1, false) FROM "classes";

      -- 3. Seed Subjects (Class 1-2)
      INSERT INTO "subjects" ("id", "class_id", "name", "medium") VALUES
        (101, 1, 'English', 'English/Hindi'), (102, 1, 'Mathematics', 'English/Hindi'),
        (103, 1, 'Hindi', 'English/Hindi'), (104, 1, 'Urdu', 'English/Hindi'),
        (201, 2, 'English', 'English/Hindi'), (202, 2, 'Mathematics', 'English/Hindi'),
        (203, 2, 'Hindi', 'English/Hindi'), (204, 2, 'Urdu', 'English/Hindi')
      ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "class_id" = EXCLUDED."class_id";

      -- Seed Subjects (Class 3-5)
      INSERT INTO "subjects" ("id", "class_id", "name", "medium") VALUES
        (301, 3, 'Mathematics', 'English/Hindi'), (302, 3, 'Hindi', 'English/Hindi'),
        (303, 3, 'English', 'English/Hindi'), (304, 3, 'The World Around Us', 'English/Hindi'),
        (305, 3, 'Arts', 'English/Hindi'), (306, 3, 'Physical Education', 'English/Hindi'),
        (307, 3, 'Urdu', 'English/Hindi'),
        (401, 4, 'Mathematics', 'English/Hindi'), (402, 4, 'Hindi', 'English/Hindi'),
        (403, 4, 'English', 'English/Hindi'), (404, 4, 'The World Around Us', 'English/Hindi'),
        (405, 4, 'Arts', 'English/Hindi'), (406, 4, 'Physical Education', 'English/Hindi'),
        (407, 4, 'Urdu', 'English/Hindi'),
        (501, 5, 'Mathematics', 'English/Hindi'), (502, 5, 'Hindi', 'English/Hindi'),
        (503, 5, 'English', 'English/Hindi'), (504, 5, 'The World Around Us', 'English/Hindi'),
        (505, 5, 'Arts', 'English/Hindi'), (506, 5, 'Physical Education', 'English/Hindi'),
        (507, 5, 'Urdu', 'English/Hindi')
      ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "class_id" = EXCLUDED."class_id";

      -- Seed Subjects (Class 6-8)
      INSERT INTO "subjects" ("id", "class_id", "name", "medium") VALUES
        (601, 6, 'Hindi', 'English/Hindi'), (602, 6, 'English', 'English/Hindi'),
        (603, 6, 'Mathematics', 'English/Hindi'), (604, 6, 'Social Science', 'English/Hindi'),
        (605, 6, 'Sanskrit', 'English/Hindi'), (606, 6, 'Science', 'English/Hindi'),
        (607, 6, 'Arts', 'English/Hindi'), (608, 6, 'Physical Education', 'English/Hindi'),
        (609, 6, 'Vocational Education', 'English/Hindi'), (610, 6, 'Urdu', 'English/Hindi'),
        (701, 7, 'Hindi', 'English/Hindi'), (702, 7, 'English', 'English/Hindi'),
        (703, 7, 'Mathematics', 'English/Hindi'), (704, 7, 'Social Science', 'English/Hindi'),
        (705, 7, 'Sanskrit', 'English/Hindi'), (706, 7, 'Science', 'English/Hindi'),
        (707, 7, 'Arts', 'English/Hindi'), (708, 7, 'Physical Education', 'English/Hindi'),
        (709, 7, 'Vocational Education', 'English/Hindi'), (710, 7, 'Urdu', 'English/Hindi'),
        (801, 8, 'Hindi', 'English/Hindi'), (802, 8, 'English', 'English/Hindi'),
        (803, 8, 'Mathematics', 'English/Hindi'), (804, 8, 'Social Science', 'English/Hindi'),
        (805, 8, 'Sanskrit', 'English/Hindi'), (806, 8, 'Science', 'English/Hindi'),
        (807, 8, 'Arts', 'English/Hindi'), (808, 8, 'Physical Education', 'English/Hindi'),
        (809, 8, 'Vocational Education', 'English/Hindi'), (810, 8, 'Urdu', 'English/Hindi')
      ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "class_id" = EXCLUDED."class_id";

      SELECT setval(pg_get_serial_sequence('subjects', 'id'), coalesce(max(id), 0) + 1, false) FROM "subjects";
    `);
    console.log("Academy tables and seed data setup completed.");
    return NextResponse.json({ success: true, message: "Tables created and seeded." });
  } catch (error: any) {
    console.error("DB setup error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
