-- Add assignedTeacherId column to subjects table
ALTER TABLE "subjects" ADD COLUMN "assigned_teacher_id" uuid REFERENCES "teachers"("id") ON DELETE SET NULL;
