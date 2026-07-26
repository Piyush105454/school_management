-- Update June scholarship records with new attendance logic (All or Nothing)
-- If attendance >= 90%, full amount (750). Otherwise, 0.

UPDATE scholarship_records sr
SET 
  attendance_amount = CASE 
    WHEN sa.percentage >= 90 THEN 750
    ELSE 0
  END,
  total_amount = (
    CASE 
      WHEN sa.percentage >= 90 THEN 750
      ELSE 0
    END
  ) + sr.homework_amount + sr.guardian_amount + sr.ptm_amount,
  pending_amount = GREATEST(
    0,
    sr.school_fee - (
      (CASE 
        WHEN sa.percentage >= 90 THEN 750
        ELSE 0
      END) + sr.homework_amount + sr.guardian_amount + sr.ptm_amount
    ) - sr.discount_amount + sr.additional_charge_amount
  ),
  updated_at = NOW()
FROM scholarship_attendance sa
WHERE sr.admission_id = sa.admission_id
  AND sr.month = sa.month
  AND sr.year = sa.year
  AND sr.month = 'June'
  AND sr.year = '2026';

-- Verify the update
SELECT 
  sr.id,
  sr.month,
  sr.year,
  sa.percentage as attendance_pct,
  sr.attendance_amount,
  sr.total_amount,
  sr.pending_amount
FROM scholarship_records sr
INNER JOIN scholarship_attendance sa 
  ON sr.admission_id = sa.admission_id 
  AND sr.month = sa.month 
  AND sr.year = sa.year
WHERE sr.month = 'June' 
  AND sr.year = '2026'
ORDER BY sr.created_at DESC
LIMIT 10;
