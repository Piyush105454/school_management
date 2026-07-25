-- Add schoolFee and pendingAmount fields to scholarship_records table
-- This ensures data consistency across all UI displays

ALTER TABLE scholarship_records 
ADD COLUMN IF NOT EXISTS school_fee integer NOT NULL DEFAULT 3000;

ALTER TABLE scholarship_records 
ADD COLUMN IF NOT EXISTS pending_amount integer NOT NULL DEFAULT 0;

-- Update existing records to calculate schoolFee and pendingAmount
-- schoolFee = sum of all max criteria amounts (typically 3000)
-- pendingAmount = schoolFee - totalAmount + adjustmentAmount

UPDATE scholarship_records sr
SET 
  school_fee = COALESCE(
    (SELECT 
      COALESCE(sc.attendance_amount, 750) + 
      COALESCE(sc.homework_amount, 750) + 
      COALESCE(sc.guardian_amount, 750) + 
      COALESCE(sc.ptm_amount, 750)
    FROM scholarship_criteria_settings sc
    WHERE sc.admission_id = sr.admission_id
    AND sc.academic_year = '2025-26'
    LIMIT 1),
    -- Fallback to default criteria if student-specific not found
    (SELECT 
      COALESCE(sc.attendance_amount, 750) + 
      COALESCE(sc.homework_amount, 750) + 
      COALESCE(sc.guardian_amount, 750) + 
      COALESCE(sc.ptm_amount, 750)
    FROM scholarship_criteria_settings sc
    WHERE sc.admission_id IS NULL
    AND sc.academic_year = '2025-26'
    LIMIT 1)
  ),
  pending_amount = GREATEST(0, 
    COALESCE(
      (SELECT 
        COALESCE(sc.attendance_amount, 750) + 
        COALESCE(sc.homework_amount, 750) + 
        COALESCE(sc.guardian_amount, 750) + 
        COALESCE(sc.ptm_amount, 750)
      FROM scholarship_criteria_settings sc
      WHERE sc.admission_id = sr.admission_id
      AND sc.academic_year = '2025-26'
      LIMIT 1),
      (SELECT 
        COALESCE(sc.attendance_amount, 750) + 
        COALESCE(sc.homework_amount, 750) + 
        COALESCE(sc.guardian_amount, 750) + 
        COALESCE(sc.ptm_amount, 750)
      FROM scholarship_criteria_settings sc
      WHERE sc.admission_id IS NULL
      AND sc.academic_year = '2025-26'
      LIMIT 1)
    ) - sr.total_amount + sr.adjustment_amount
  )
WHERE school_fee = 3000; -- Only update records that haven't been updated yet

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_scholarship_records_pending 
ON scholarship_records(pending_amount) 
WHERE status = 'PENDING';
