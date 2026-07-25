-- Update all June PTM attendance records to set PTM amount to ₹750
-- This query updates the scholarship_records table for all students who attended PTM in June

-- Step 1: Update scholarship_records table - set ptmAmount to 750 for June records where PTM was attended
UPDATE scholarship_records
SET 
  ptm_amount = 750,
  total_amount = attendance_amount + homework_amount + guardian_amount + 750 + adjustment_amount - discount_amount + additional_charge_amount,
  updated_at = NOW()
WHERE 
  month = 'June' 
  AND EXISTS (
    SELECT 1 
    FROM scholarship_ptm 
    WHERE scholarship_ptm.admission_id = scholarship_records.admission_id
      AND scholarship_ptm.month = 'June'
      AND scholarship_ptm.year = scholarship_records.year
      AND scholarship_ptm.attended = true
  );

-- Step 2: Verify the update by showing all June PTM records
SELECT 
  sr.id,
  am.admission_number,
  am.scholar_number,
  sb.first_name || ' ' || sb.last_name as student_name,
  sr.month,
  sr.year,
  sp.attended as ptm_attended,
  sp.attendee,
  sr.ptm_amount,
  sr.attendance_amount,
  sr.homework_amount,
  sr.guardian_amount,
  sr.total_amount,
  sr.status,
  sr.locked,
  sr.updated_at
FROM 
  scholarship_records sr
  INNER JOIN admission_meta am ON sr.admission_id = am.id
  INNER JOIN student_bio sb ON am.id = sb.admission_id
  LEFT JOIN scholarship_ptm sp ON sr.admission_id = sp.admission_id 
    AND sr.month = sp.month 
    AND sr.year = sp.year
WHERE 
  sr.month = 'June'
ORDER BY 
  am.scholar_number ASC;
