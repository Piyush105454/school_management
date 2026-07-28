-- Add reviewer columns to subjects table
ALTER TABLE "subjects" ADD COLUMN "reviewer_id_1" uuid REFERENCES "teachers"("id") ON DELETE SET NULL;
ALTER TABLE "subjects" ADD COLUMN "reviewer_id_2" uuid REFERENCES "teachers"("id") ON DELETE SET NULL;
