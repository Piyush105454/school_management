-- Update all existing scholarship records with school_fee and pending_amount
-- This ensures the UI displays correctly by reading from database

-- Step 1: Add columns if they don't exist (run this first)
ALTER TABLE scholarship_records 
ADD COLUMN IF NOT EXISTS school_fee integer;

ALTER TABLE scholarship_records 
ADD COLUMN IF NOT EXISTS pending_amount integer;

-- Step 2: Update all records with calculated values
UPDATE scholarship_records sr
SET 
  school_fee = (
    -- Get school fee from student-specific criteria OR global criteria
    SELECT 
      COALESCE(sc.attendance_amount, 750) + 
      COALESCE(sc.homework_amount, 750) + 
      COALESCE(sc.guardian_amount, 750) + 
      COALESCE(sc.ptm_amount, 750)
    FROM scholarship_criteria_settings sc
    WHERE (sc.admission_id = sr.admission_id OR sc.admission_id IS NULL)
      AND sc.academic_year = '2025-26'
    ORDER BY sc.admission_id DESC NULLS LAST
    LIMIT 1
  ),
  pending_amount = GREATEST(0, 
    (
      -- Calculate: school_fee - scholarship_earned + adjustments
      SELECT 
        COALESCE(sc.attendance_amount, 750) + 
        COALESCE(sc.homework_amount, 750) + 
        COALESCE(sc.guardian_amount, 750) + 
        COALESCE(sc.ptm_amount, 750)
      FROM scholarship_criteria_settings sc
      WHERE (sc.admission_id = sr.admission_id OR sc.admission_id IS NULL)
        AND sc.academic_year = '2025-26'
      ORDER BY sc.admission_id DESC NULLS LAST
      LIMIT 1
    ) - sr.total_amount + COALESCE(sr.adjustment_amount, 0)
  )
WHERE sr.school_fee IS NULL OR sr.pending_amount IS NULL;

-- Step 3: Set default values for any records that still don't have values
UPDATE scholarship_records 
SET school_fee = 3000 
WHERE school_fee IS NULL;

UPDATE scholarship_records 
SET pending_amount = GREATEST(0, school_fee - total_amount + COALESCE(adjustment_amount, 0))
WHERE pending_amount IS NULL;

-- Step 4: Make columns NOT NULL (after all records have values)
ALTER TABLE scholarship_records 
ALTER COLUMN school_fee SET NOT NULL,
ALTER COLUMN school_fee SET DEFAULT 3000;

ALTER TABLE scholarship_records 
ALTER COLUMN pending_amount SET NOT NULL,
ALTER COLUMN pending_amount SET DEFAULT 0;

-- Step 5: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_scholarship_records_pending 
ON scholarship_records(pending_amount) 
WHERE status = 'PENDING';

-- Verification Query: Check if update was successful
SELECT 
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE school_fee IS NOT NULL) as records_with_school_fee,
  COUNT(*) FILTER (WHERE pending_amount IS NOT NULL) as records_with_pending_amount,
  SUM(pending_amount) as total_pending_across_all_students
FROM scholarship_records;

-- View sample records to verify
SELECT 
  sr.month,
  sr.year,
  sr.school_fee,
  sr.total_amount as scholarship_earned,
  sr.adjustment_amount,
  sr.pending_amount,
  sr.status
FROM scholarship_records sr
ORDER BY sr.created_at DESC
LIMIT 10;
